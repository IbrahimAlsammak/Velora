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

    /** Price for any city that is NOT in the city list ("Other city"). Empty = $0. */
    @Column(precision = 10, scale = 2)
    private BigDecimal otherCitiesFee;

    /** Orders of this amount or more get free delivery. Empty = no free delivery. */
    @Column(precision = 10, scale = 2)
    private BigDecimal freeDeliveryOver;
}
