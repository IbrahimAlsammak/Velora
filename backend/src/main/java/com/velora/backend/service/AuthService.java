package com.velora.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.AuthDtos.AuthResponse;
import com.velora.backend.dto.AuthDtos.ChangePasswordRequest;
import com.velora.backend.dto.AuthDtos.LoginRequest;
import com.velora.backend.dto.AuthDtos.ProfileRequest;
import com.velora.backend.dto.AuthDtos.RegisterRequest;
import com.velora.backend.dto.AuthDtos.UserDto;
import com.velora.backend.entity.Role;
import com.velora.backend.entity.User;
import com.velora.backend.repository.UserRepository;
import com.velora.backend.util.Phones;

@Service
public class AuthService {

    /** How long a login lasts before you must log in again. */
    private static final Duration TOKEN_LIFETIME = Duration.ofHours(8);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    /** Customers log in with their phone number, the admin with their email. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String login = request.login().trim();
        Optional<User> found = login.contains("@")
                ? userRepository.findByEmailIgnoreCase(login)
                : Phones.normalizeLebanese(login).flatMap(userRepository::findByPhone);
        User user = found
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Same message for "no such account" and "wrong password" - don't help attackers guess
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Wrong phone number or password."));
        return new AuthResponse(createToken(user), UserDto.from(user));
    }

    /** Sign up as a new CUSTOMER with a Lebanese phone number, and log them in straight away. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String phone = Phones.normalizeLebanese(request.phone()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a valid Lebanese phone number, e.g. 03 123 456."));
        if (userRepository.findByPhone(phone).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this phone number already exists. Try logging in.");
        }
        User user = new User();
        user.setPhone(phone);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER); // sign-up can NEVER create an admin
        userRepository.save(user);
        return new AuthResponse(createToken(user), UserDto.from(user));
    }

    @Transactional
    public void changePassword(String tokenSubject, ChangePasswordRequest request) {
        User user = findUser(tokenSubject);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is not correct.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    /** "My details": customers change name + phone, the admin changes name + email. */
    @Transactional
    public UserDto updateProfile(String tokenSubject, ProfileRequest request) {
        User user = findUser(tokenSubject);
        user.setFullName(request.fullName().trim());

        if (user.getRole() == Role.CUSTOMER) {
            String phone = Phones.normalizeLebanese(request.phone()).orElseThrow(() -> badRequest(
                    "Please enter a valid Lebanese phone number, e.g. 03 123 456."));
            userRepository.findByPhone(phone)
                    .filter(other -> !other.getId().equals(user.getId()))
                    .ifPresent(other -> { throw badRequest( "Another account already uses this phone number."); });
            user.setPhone(phone);
        } else {
            String email = request.email() == null ? "" : request.email().trim().toLowerCase();
            if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                throw badRequest( "Please enter a valid email.");
            }
            userRepository.findByEmailIgnoreCase(email)
                    .filter(other -> !other.getId().equals(user.getId()))
                    .ifPresent(other -> { throw badRequest( "Another account already uses this email."); });
            user.setEmail(email);
        }
        return UserDto.from(user);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Finds the logged-in user from their token. The token's "subject" is the account's ID number.
     * (Old tokens from before this change carried an email -> "please log in again".)
     */
    @Transactional(readOnly = true)
    public User findUser(String tokenSubject) {
        return parseId(tokenSubject)
                .flatMap(userRepository::findById)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again."));
    }

    /** Same as findUser, but empty instead of an error (used when placing an order). */
    @Transactional(readOnly = true)
    public Optional<User> findUserIfExists(String tokenSubject) {
        return parseId(tokenSubject).flatMap(userRepository::findById);
    }

    @Transactional(readOnly = true)
    public UserDto me(String tokenSubject) {
        return UserDto.from(findUser(tokenSubject));
    }

    /** Builds the signed token. Inside: the account ID, the role, and when it expires. */
    private String createToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("velora")
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .claim("role", user.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static Optional<Long> parseId(String subject) {
        try {
            return Optional.of(Long.parseLong(subject));
        } catch (NumberFormatException | NullPointerException e) {
            return Optional.empty();
        }
    }
}
