package com.velora.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** The DEFAULT delivery price for one area of Lebanon (used when the city has no price of its own). */
@Entity
@Table(name = "delivery_region_fees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegionFee {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Region region;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fee;
}
