package com.velora.backend.dto;

import java.math.BigDecimal;

import com.velora.backend.entity.Product;

/** The product data the website receives (as JSON). */
public record ProductDto(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean inStock,
        boolean featured,
        String categoryName,
        String categorySlug) {

    public static ProductDto from(Product p) {
        return new ProductDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getPrice(),
                p.getImageUrl(),
                p.getStock() > 0,      // customers only need "in stock: yes/no", not the exact number
                p.isFeatured(),
                p.getCategory().getName(),
                p.getCategory().getSlug());
    }
}
