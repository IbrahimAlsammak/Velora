package com.velora.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.Category;

/**
 * Talks to the "categories" table.
 * We only write the method NAMES - Spring writes the SQL for us from the name.
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);   // SELECT * FROM categories WHERE slug = ?

    List<Category> findAllByOrderByNameAsc();     // SELECT * FROM categories ORDER BY name
}
