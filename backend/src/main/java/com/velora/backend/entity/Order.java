package com.velora.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A customer's order. Table name is "orders" because ORDER is a reserved word in SQL.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The number the customer sees, e.g. VEL-7K3M9QX2. Hard to guess on purpose. */
    @Column(nullable = false, unique = true, length = 20)
    private String orderNumber;

    @Enumerated(EnumType.STRING) // store the word "PENDING", not a number
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    /** "default 'CASH_ON_DELIVERY'" -> older orders (before this column existed) count as cash on delivery. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30) default 'CASH_ON_DELIVERY'")
    private PaymentMethod paymentMethod = PaymentMethod.CASH_ON_DELIVERY;

    /** The customer's account, if they were logged in. null = guest checkout. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // ----- Customer & delivery details -----
    @Column(nullable = false, length = 120) private String customerName;
    @Column(length = 160)                   private String email;   // older orders only - we contact customers by phone
    @Column(nullable = false, length = 30)  private String phone;
    /** Area of Lebanon (empty for very old orders placed before this field existed). */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)                    private Region region;
    @Column(nullable = false, length = 100) private String city;         // city / town, e.g. Jounieh
    @Column(nullable = false, length = 250) private String addressLine;  // street / neighbourhood
    @Column(length = 120)                   private String building;     // building name or number
    @Column(length = 30)                    private String floor;
    @Column(length = 200)                   private String landmark;     // "next to Spinneys", helps the driver
    @Column(length = 20)                    private String postalCode;
    @Column(nullable = false, length = 80)  private String country;
    @Column(length = 500)                   private String notes;

    // ----- Money (always calculated by the backend, never taken from the browser) -----
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal subtotal;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal shippingCost;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal total;

    /** One order has many lines. cascade = saving the order also saves its lines. */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }
}
