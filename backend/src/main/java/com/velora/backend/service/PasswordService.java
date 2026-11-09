package com.velora.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.entity.Role;
import com.velora.backend.entity.User;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.repository.UserRepository;

/**
 * Passwords the ADMIN sets, with no current password needed:
 *  - a customer who forgot theirs contacts you (WhatsApp), you give them a new one
 *  - you change your own admin password
 */
@Service
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final OrderRepository orderRepository;

    public PasswordService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthService authService,
                           OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public void setCustomerPassword(Long customerId, String newPassword) {
        User user = userRepository.findById(customerId)
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    /**
     * Delete a customer's account. Their orders are KEPT (as guest orders) - they're your sales records.
     * Only customers can be deleted, never the admin.
     */
    @Transactional
    public void deleteCustomer(Long customerId) {
        User user = userRepository.findById(customerId)
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        orderRepository.unlinkOrdersFromUser(user.getId());
        userRepository.delete(user);
    }

    @Transactional
    public void setOwnPassword(String tokenSubject, String newPassword) {
        User user = authService.findUser(tokenSubject);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
