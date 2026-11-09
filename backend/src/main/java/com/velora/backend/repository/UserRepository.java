package com.velora.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.Role;
import com.velora.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    /** phone must already be in the "+961..." form (util/Phones). */
    Optional<User> findByPhone(String phone);

    /** The (first) admin account. */
    Optional<User> findFirstByRoleOrderByIdAsc(Role role);

    /** Admin "Customers" page: all customer accounts, newest first. */
    List<User> findByRoleOrderByCreatedAtDesc(Role role);
}
