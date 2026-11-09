package com.velora.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One colour option of a product, e.g. "Dusty Rose" with hex code "#C9A0A0".
 * @Embeddable = it has no table of its own; it's stored as a row in "product_colors"
 * that belongs to a product.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductColor {

    @Column(nullable = false, length = 40)
    private String name;

    /** Colour code used to draw the little colour circle on the website. */
    @Column(nullable = false, length = 7)
    private String hex;
}
