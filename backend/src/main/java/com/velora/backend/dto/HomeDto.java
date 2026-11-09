package com.velora.backend.dto;

import java.util.List;

/** Everything the home page needs, in one answer. */
public record HomeDto(
        List<ProductDto> featured,
        List<ProductDto> newArrivals,
        List<HomeCategory> categories) {

    /** A category tile: name + how many products + a photo (from one of its products, if any). */
    public record HomeCategory(Long id, String name, String slug, String description,
                               long productCount, String imageUrl) {}
}
