package com.velora.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.velora.backend.entity.Role;
import com.velora.backend.entity.User;
import com.velora.backend.repository.UserRepository;

/**
 * Creates YOUR admin account from application-secrets.properties when the server starts.
 * You can change your name, email and password in the admin panel ("My account") - kept across restarts.
 * Forgot your password? Put a NEW password in velora.admin.password in that file and restart the backend.
 * (The file's email/name/password are only applied when you CHANGE them in the file.)
 */
@Component
public class AdminAccountSetup implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSetup.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;

    public AdminAccountSetup(UserRepository userRepository, PasswordEncoder passwordEncoder,
                             @Value("${velora.admin.email:}") String email,
                             @Value("${velora.admin.password:}") String password,
                             @Value("${velora.admin.name:Velora Admin}") String name) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim();
        this.password = password;
        this.name = name.isBlank() ? "Velora Admin" : name.trim();
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email.isEmpty() || email.startsWith("PUT_") || !email.contains("@")) {
            log.warn("No admin account: set velora.admin.email in application-secrets.properties");
            return;
        }
        if (password.length() < 10 || password.startsWith("PUT_")) {
            log.warn("No admin account: velora.admin.password must be at least 10 characters");
            return;
        }

        // Find the admin account (by its email from the file, or simply "the admin"), or create it
        User admin = userRepository.findByEmailIgnoreCase(email)
                .or(() -> userRepository.findFirstByRoleOrderByIdAsc(Role.ADMIN))
                .orElseGet(User::new);
        boolean isNew = admin.getId() == null;
        admin.setRole(Role.ADMIN);

        // Email and name: the file only wins if it's new or you CHANGED it in the file since last time.
        // Otherwise keep what you set in the admin panel ("My account").
        String fileEmail = email.toLowerCase();
        if (isNew || !fileEmail.equals(admin.getSetupEmail())) {
            admin.setEmail(fileEmail);
            admin.setSetupEmail(fileEmail);
        }
        if (isNew || !name.equals(admin.getSetupName())) {
            admin.setFullName(name);
            admin.setSetupName(name);
        }
        // Apply the file's password ONLY if it's new or you CHANGED it in the file since last time.
        // Otherwise keep the current password (e.g. one you set in the admin panel).
        boolean fileChanged = admin.getSetupPasswordHash() == null
                || !passwordEncoder.matches(password, admin.getSetupPasswordHash());
        if (isNew || fileChanged) {
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setSetupPasswordHash(passwordEncoder.encode(password));
            log.info("Admin password set from application-secrets.properties");
        }
        userRepository.save(admin);
        log.info("Admin account ready: {}", admin.getEmail());
    }
}
