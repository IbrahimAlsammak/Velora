package com.velora.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A product category, e.g. "Hijabs" or "Abayas".
 * @Entity = Spring/Hibernate turns this class into a MySQL table called "categories".
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // MySQL gives each row a number: 1, 2, 3...
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    /** URL-friendly version of the name, e.g. "Hijabs" -> "hijabs". Used in links like /shop?category=hijabs */
    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(length = 500)
    private String description;

    public Category(String name, String slug, String description) {
        this.name = name;
        this.slug = slug;
        this.description = description;
    }
}
