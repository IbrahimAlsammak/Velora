package com.velora.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A product in the store. Becomes the MySQL table "products". */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(length = 2000)
    private String description;

    /** BigDecimal = exact money maths (no rounding errors like 19.999999). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** The MAIN photo (shown on product cards and the home page) = the first of "images". Empty -> placeholder. */
    private String imageUrl;

    /** All photos of the product, in order (first = main). Stored in the table "product_images". */
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", length = 255)
    private List<String> images = new ArrayList<>();

    /** All photos - also works for older products that only have a main photo. */
    public List<String> getAllImages() {
        if (!images.isEmpty()) return List.copyOf(images);
        return imageUrl == null ? List.of() : List.of(imageUrl);
    }

    /**
     * How many pieces are in stock IN TOTAL.
     * For products with colours/sizes this is the sum of all combinations in "variants"
     * (kept up to date automatically), so "Sold out" etc. keep working the same way.
     */
    @Column(nullable = false)
    private int stock;

    /**
     * Stock per colour + size, e.g. Black/M = 3, Black/L = 0, Navy/M = 2.
     * Empty for products without colours or sizes (they only use "stock").
     */
    @ElementCollection
    @CollectionTable(name = "product_variant_stock", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    private List<VariantStock> variants = new ArrayList<>();

    /**
     * Visible in the shop? false = hidden (kept for old orders, but customers can't see or buy it).
     * "default true" -> existing products stay visible when this column is added.
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    /** Show on the home page as "featured"? */
    @Column(nullable = false)
    private boolean featured;

    /** Many products belong to one category -> MySQL stores a "category_id" column. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    /** Colour options -> stored in the table "product_colors". Empty = no colour choice. */
    @ElementCollection
    @CollectionTable(name = "product_colors", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position") // keep colours in the order we added them
    private List<ProductColor> colors = new ArrayList<>();

    /** Size options, e.g. S, M, L, XL -> stored in the table "product_sizes". Empty = one size. */
    @ElementCollection
    @CollectionTable(name = "product_sizes", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "size", length = 20)
    private List<String> sizes = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /** Does this product have colour and/or size choices? (then stock is counted per combination) */
    public boolean hasOptions() {
        return !colors.isEmpty() || !sizes.isEmpty();
    }

    /** The stock row of one colour + size (empty colour/size = "no choice"). */
    public Optional<VariantStock> findVariant(String color, String size) {
        return variants.stream()
                .filter(v -> Objects.equals(v.getColor(), color) && Objects.equals(v.getSize(), size))
                .findFirst();
    }

    /** Every colour + size combination, e.g. [Black,M] [Black,L] [Navy,M] [Navy,L]. */
    public List<String[]> combinations() {
        List<String> colorNames = colors.isEmpty() ? java.util.Collections.singletonList(null)
                : colors.stream().map(ProductColor::getName).toList();
        List<String> sizeNames = sizes.isEmpty() ? java.util.Collections.singletonList(null) : sizes;
        List<String[]> result = new ArrayList<>();
        for (String c : colorNames) {
            for (String s : sizeNames) {
                result.add(new String[] {c, s});
            }
        }
        return result;
    }

    /** Total stock = sum of all combinations (only for products with colours/sizes). */
    public void recountStock() {
        if (hasOptions()) {
            stock = variants.stream().mapToInt(VariantStock::getStock).sum();
        }
    }

    /**
     * Creates the stock rows for every combination: the first one gets "firstStock" pieces, the others 0.
     * Used once for products made before stock-per-combination existed.
     */
    public void createVariants(int firstStock) {
        variants.clear();
        if (!hasOptions()) return;
        boolean first = true;
        for (String[] combo : combinations()) {
            variants.add(new VariantStock(combo[0], combo[1], first ? firstStock : 0));
            first = false;
        }
        recountStock();
    }

    /** Runs automatically just before a new product is saved. */
    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
