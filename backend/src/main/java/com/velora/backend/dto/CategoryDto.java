package com.velora.backend.dto;

import com.velora.backend.entity.Category;

/**
 * DTO = "Data Transfer Object": the exact shape of data we send to the website.
 * We send this instead of the database entity, so we control what the public sees.
 */
public record CategoryDto(Long id, String name, String slug, String description) {

    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription());
    }
}
