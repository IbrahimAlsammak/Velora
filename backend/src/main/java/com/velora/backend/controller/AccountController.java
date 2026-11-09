package com.velora.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.AdminDtos.OrderSummary;
import com.velora.backend.dto.AuthDtos.ChangePasswordRequest;
import com.velora.backend.dto.AuthDtos.ProfileRequest;
import com.velora.backend.dto.AuthDtos.UserDto;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.service.AuthService;

import jakarta.validation.Valid;

/**
 * The logged-in customer's own account (needs a login token - see SecurityConfig).
 *   GET  /api/account/orders    -> my orders, newest first
 *   PUT  /api/account/profile   -> change my name / phone (or email for the admin)
 *   POST /api/account/password  -> change my password
 */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AuthService authService;
    private final OrderRepository orderRepository;

    public AccountController(AuthService authService, OrderRepository orderRepository) {
        this.authService = authService;
        this.orderRepository = orderRepository;
    }

    /** @AuthenticationPrincipal Jwt = the checked login token; its "subject" is the user's email. */
    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public List<OrderSummary> myOrders(@AuthenticationPrincipal Jwt jwt) {
        Long userId = authService.findUser(jwt.getSubject()).getId();
        // Only THIS user's orders - nobody can see anyone else's
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderSummary::from)
                .toList();
    }

    /** PUT /api/account/profile -> change my name + phone (customers) or name + email (admin) */
    @PutMapping("/profile")
    public UserDto updateProfile(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProfileRequest request) {
        return authService.updateProfile(jwt.getSubject(), request);
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(jwt.getSubject(), request);
    }
}
