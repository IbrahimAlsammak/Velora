package com.velora.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.AuthDtos.AuthResponse;
import com.velora.backend.dto.AuthDtos.LoginRequest;
import com.velora.backend.dto.AuthDtos.RegisterRequest;
import com.velora.backend.dto.AuthDtos.UserDto;
import com.velora.backend.service.AuthService;

import jakarta.validation.Valid;

/**
 *   POST /api/auth/login     -> phone (customers) or email (admin) + password in, token out
 *   POST /api/auth/register  -> create a customer account (and log in)
 *   GET  /api/auth/me     -> "who am I?" (needs a valid token)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }


    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(jwt.getSubject());
    }
}
