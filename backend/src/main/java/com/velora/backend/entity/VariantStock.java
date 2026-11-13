package com.velora.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stock of ONE colour + size combination of a product, e.g. Black / M -> 3 pieces.
 * Stored as a row in the table "product_variant_stock".
 * color is empty for products without colours, size is empty for products without sizes.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VariantStock {

    @Column(length = 40)
    private String color;

    @Column(length = 20)
    private String size;

    @Column(nullable = false)
    private int stock;
}
