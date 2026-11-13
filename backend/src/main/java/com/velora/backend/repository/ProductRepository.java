package com.velora.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.velora.backend.entity.Product;

import jakarta.persistence.LockModeType;

/** Talks to the "products" table. Spring writes the SQL from the method names. */
public interface ProductRepository extends JpaRepository<Product, Long> {

    // @EntityGraph = "also load the category in the same query" (faster, and avoids errors)

    // ----- Shop (customers): only ACTIVE products -----
    @EntityGraph(attributePaths = "category")
    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findByActiveTrueAndCategorySlugOrderByCreatedAtDesc(String categorySlug);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findBySlugAndActiveTrue(String slug);

    // ----- Home page -----
    @EntityGraph(attributePaths = "category")
    List<Product> findTop8ByActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();          // ★ featured

    @EntityGraph(attributePaths = "category")
    List<Product> findTop4ByActiveTrueAndStockGreaterThanOrderByCreatedAtDesc(int stock); // newest in stock

    /** Newest visible product of a category that has a photo (for the category picture). */
    Optional<Product> findFirstByActiveTrueAndCategoryIdAndImageUrlIsNotNullOrderByFeaturedDescCreatedAtDesc(Long categoryId);

    long countByActiveTrueAndCategoryId(Long categoryId);

    /** Total pieces in stock of all visible products (goes down with every order). */
    @Query("select coalesce(sum(p.stock), 0) from Product p where p.active = true")
    long totalStockOfActiveProducts();

    // ----- Admin: ALL products, including hidden ones -----
    @EntityGraph(attributePaths = "category")
    List<Product> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findByActiveTrueAndStockLessThanEqualOrderByStockAsc(int stock); // low-stock warning

    boolean existsBySlug(String slug);

    long countByCategoryId(Long categoryId);

    long countByActiveTrue();

    /**
     * Load a product AND lock its row until the order is saved.
     * If two customers buy the last abaya at the same second, the second one waits,
     * then sees stock = 0 -> no overselling.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
