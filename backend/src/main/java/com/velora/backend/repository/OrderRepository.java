package com.velora.backend.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = "items")
    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    // ----- Customer account: "My orders" -----
    @EntityGraph(attributePaths = "items")
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ----- Admin -----
    @EntityGraph(attributePaths = "items")
    List<Order> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    @EntityGraph(attributePaths = "items")
    List<Order> findTop5ByOrderByCreatedAtDesc();

    long countByStatus(OrderStatus status);

    long countByUserId(Long userId);

    /** Sales report: orders since a moment that have one of these statuses (shipped or delivered). */
    @EntityGraph(attributePaths = "items")
    List<Order> findByCreatedAtGreaterThanEqualAndStatusIn(Instant from, Collection<OrderStatus> statuses);

    /** Before deleting a customer: keep their orders, but unlink them (they become guest orders). */
    @Modifying
    @Query("update Order o set o.user = null where o.user.id = :userId")
    void unlinkOrdersFromUser(@Param("userId") Long userId);

    /** Total money from orders that are shipped or delivered (real sales). */
    @Query("select coalesce(sum(o.total), 0) from Order o where o.status in (com.velora.backend.entity.OrderStatus.SHIPPED, com.velora.backend.entity.OrderStatus.DELIVERED)")
    BigDecimal totalSales();

    /** Before deleting a product: past orders keep their copy of it, but lose the link. */
    @Modifying
    @Query("update OrderItem i set i.product = null where i.product.id = :productId")
    void unlinkOrderItemsFromProduct(@Param("productId") Long productId);
}
