package com.velora.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.velora.backend.entity.Product;

/**
 * Everything the PRODUCT PAGE needs (more than the shop grid needs):
 * the colour and size options too, and the stock of each colour + size
 * (so sold-out combinations can be crossed out).
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
        List<String> sizes,
        List<VariantDto> variants) {

    public record ColorDto(String name, String hex) {}

    /** Stock of one colour + size, e.g. Black / M -> 3. */
    public record VariantDto(String color, String size, int stock) {}

    public static List<VariantDto> variantsOf(Product p) {
        return p.getVariants().stream().map(v -> new VariantDto(v.getColor(), v.getSize(), v.getStock())).toList();
    }

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
                List.copyOf(p.getSizes()),
                variantsOf(p));
    }
}
