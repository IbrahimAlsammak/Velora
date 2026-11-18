package com.velora.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Delivery settings for the whole store. There is only ever ONE row (id = 1). */
@Entity
@Table(name = "delivery_settings")
@Getter
@Setter
@NoArgsConstructor
public class DeliverySettings {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    /** The delivery fee for every order (all of Lebanon). Empty = $0.
     *  (Stored in the old "other cities" column, so the price already saved there is kept.) */
    @Column(name = "other_cities_fee", precision = 10, scale = 2)
    private BigDecimal fee;

    /** Orders of this amount or more get free delivery. Empty = no free delivery. */
    @Column(precision = 10, scale = 2)
    private BigDecimal freeDeliveryOver;
}
