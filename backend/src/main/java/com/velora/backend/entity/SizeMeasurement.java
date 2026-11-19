package com.velora.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ONE number of the size guide, e.g. Length of size M = 140 cm.
 * Stored as a row in the table "product_measurements".
 * size is empty for products without sizes ("One size").
 * cm is text, so you can also write a range like "140-142".
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SizeMeasurement {

    /** What is measured, e.g. Length, Chest, Sleeve. */
    @Column(nullable = false, length = 40)
    private String measurement;

    @Column(length = 20)
    private String size;

    @Column(nullable = false, length = 20)
    private String cm;
}
