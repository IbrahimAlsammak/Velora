package com.velora.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Someone who can log in. Table "users". */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Customers log in with their PHONE, saved as "+961..." (see util/Phones). Empty for the admin. */
    @Column(unique = true, length = 20)
    private String phone;

    /** The ADMIN logs in with email. Customers don't need one (older test accounts may have one). */
    @Column(unique = true, length = 160)
    private String email;

    /**
     * NEVER the real password - only a scrambled "hash" of it (BCrypt).
     * Even if someone stole the database, they couldn't read the passwords.
     */
    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /**
     * ADMIN only: a scrambled copy of the password last taken from the secrets file.
     * Lets the backend notice when YOU change the file (then the file password is applied),
     * while a password changed in the admin panel is kept across restarts.
     */
    @Column(length = 100)
    private String setupPasswordHash;

    /** ADMIN only: the email and name last taken from the secrets file (same idea as setupPasswordHash). */
    @Column(length = 160)
    private String setupEmail;

    @Column(length = 120)
    private String setupName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
