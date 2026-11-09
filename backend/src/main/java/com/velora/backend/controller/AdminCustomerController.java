package com.velora.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.AdminDtos.CustomerSummary;
import com.velora.backend.dto.AuthDtos.AdminSetPasswordRequest;
import com.velora.backend.entity.Role;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.repository.UserRepository;
import com.velora.backend.service.PasswordService;

import jakarta.validation.Valid;

/**
 * Admin only (it's under /api/admin):
 *   GET /api/admin/customers                  -> all customer accounts
 *   PUT /api/admin/customers/{id}/password    -> give a customer a new password (no current password needed)
 */
@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordService passwordService;

    public AdminCustomerController(UserRepository userRepository, OrderRepository orderRepository,
                                   PasswordService passwordService) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.passwordService = passwordService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<CustomerSummary> customers() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER).stream()
                .map(u -> new CustomerSummary(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(), u.getCreatedAt(),
                        orderRepository.countByUserId(u.getId())))
                .toList();
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setPassword(@PathVariable Long id, @Valid @RequestBody AdminSetPasswordRequest request) {
        passwordService.setCustomerPassword(id, request.newPassword());
    }

    /** DELETE /api/admin/customers/{id} -> delete the account (their orders are kept as guest orders). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        passwordService.deleteCustomer(id);
    }

    /** PUT /api/admin/customers/me/password -> the logged-in ADMIN changes their OWN password (no current password). */
    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setMyPassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AdminSetPasswordRequest request) {
        passwordService.setOwnPassword(jwt.getSubject(), request.newPassword());
    }
}
