package com.velora.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.velora.backend.entity.Product;

/**
 * Everything the PRODUCT PAGE needs (more than the shop grid needs):
 * the colour and size options too.
 */
public record ProductDetailDto(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        String imageUrl,
        List<String> images,      // all photos, first = main
        boolean inStock,
        String categoryName,
        String categorySlug,
        List<ColorDto> colors,
        List<String> sizes) {

    public record ColorDto(String name, String hex) {}

    public static ProductDetailDto from(Product p) {
        return new ProductDetailDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getPrice(),
                p.getImageUrl(),
                p.getAllImages(),
                p.getStock() > 0,
                p.getCategory().getName(),
                p.getCategory().getSlug(),
                p.getColors().stream().map(c -> new ColorDto(c.getName(), c.getHex())).toList(),
                List.copyOf(p.getSizes()));
    }
}
