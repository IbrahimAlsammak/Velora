package com.velora.backend.dto;

import com.velora.backend.entity.User;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Small data shapes for accounts and logging in (grouped in one file because they're tiny). */
public final class AuthDtos {

    private AuthDtos() {}

    /** "login" = a phone number (customers) or an email (the admin). */
    public record LoginRequest(
            @NotBlank(message = "Please enter your phone number") String login,
            @NotBlank(message = "Please enter your password") String password) {}

    /** The sign-up form: name + Lebanese phone number + password. No email. */
    public record RegisterRequest(
            @NotBlank(message = "Please enter your name") @Size(max = 120) String fullName,
            @NotBlank(message = "Please enter your phone number") @Size(max = 30) String phone,
            @NotBlank(message = "Please choose a password")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String password) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Please enter your current password") String currentPassword,
            @NotBlank(message = "Please choose a new password")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String newPassword) {}

    /** Admin sets a password (a customer's, or their own) - no current password needed. */
    public record AdminSetPasswordRequest(
            @NotBlank(message = "Please enter a new password")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String newPassword) {}

    /**
     * "My details". Customers send name + phone; the admin sends name + email.
     * (Which one is required is checked in AuthService, because it depends on who you are.)
     */
    public record ProfileRequest(
            @NotBlank(message = "Please enter your name") @Size(max = 120) String fullName,
            @Size(max = 30) String phone,
            @Size(max = 160) String email) {}

    public record UserDto(Long id, String fullName, String phone, String email, String role) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(), u.getRole().name());
        }
    }

    /** What you get back after logging in or signing up: the token + who you are. */
    public record AuthResponse(String token, UserDto user) {}
}
