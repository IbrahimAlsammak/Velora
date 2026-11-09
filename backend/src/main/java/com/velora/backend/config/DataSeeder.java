package com.velora.backend.config;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.velora.backend.entity.Category;
import com.velora.backend.entity.Product;
import com.velora.backend.entity.ProductColor;
import com.velora.backend.repository.CategoryRepository;
import com.velora.backend.repository.ProductRepository;
import com.velora.backend.util.Slugs;

/**
 * SAMPLE data so the shop isn't empty while we build it.
 * - Empty database      -> creates 4 categories and 10 sample products.
 * - Products already in -> only fills in missing colours/sizes of the sample products.
 * Later you'll add real products from the admin panel.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    // ----- Reusable colour palettes -----
    private static final List<ProductColor> HIJAB_COLORS = List.of(
            color("Dusty Rose", "#C9A0A0"), color("Sand", "#D8C3A5"), color("Mulberry", "#5B3A4A"),
            color("Sage", "#A3B18A"), color("Ivory", "#F3EDE2"), color("Black", "#1F1A1C"));
    private static final List<ProductColor> ABAYA_COLORS = List.of(
            color("Black", "#1F1A1C"), color("Navy", "#2B3445"), color("Taupe", "#8B7D72"));
    private static final List<ProductColor> DRESS_COLORS = List.of(
            color("Olive", "#6B6B47"), color("Mocha", "#7B5E57"), color("Sand", "#D8C3A5"));
    private static final List<String> CLOTHING_SIZES = List.of("S", "M", "L", "XL");
    private static final List<String> ONE_SIZE = List.of();

    /** One sample product (a "record" is a small class that just holds data). */
    private record Sample(String name, String description, String price, String category, int stock,
                          boolean featured, List<ProductColor> colors, List<String> sizes) {}

    private static final List<Sample> SAMPLES = List.of(
            new Sample("Premium Chiffon Hijab", "Lightweight chiffon with a soft drape. Easy to style, perfect for warm days.", "14.99", "Hijabs", 40, true, HIJAB_COLORS, ONE_SIZE),
            new Sample("Everyday Jersey Hijab", "Stretchy, non-slip jersey that stays in place from morning to night.", "12.99", "Hijabs", 60, false, HIJAB_COLORS, ONE_SIZE),
            new Sample("Modal Silk-Touch Hijab", "Silky modal blend with a matte finish. Breathable and gentle on the skin.", "17.99", "Hijabs", 25, true, HIJAB_COLORS.subList(0, 4), ONE_SIZE),
            new Sample("Classic Black Abaya", "A timeless closed abaya in fluid crepe, with wide sleeves.", "59.99", "Abayas", 15, true, List.of(color("Black", "#1F1A1C")), CLOTHING_SIZES),
            new Sample("Open-Front Kimono Abaya", "Layer it over any outfit. Light fabric with a subtle textured weave.", "64.99", "Abayas", 12, false, ABAYA_COLORS, CLOTHING_SIZES),
            new Sample("Pleated Sleeve Abaya", "Soft pleats on the sleeves add movement to a minimal silhouette.", "69.99", "Abayas", 0, false, ABAYA_COLORS, CLOTHING_SIZES),
            new Sample("Linen Maxi Dress", "Relaxed linen-blend maxi dress with long sleeves and side pockets.", "49.99", "Dresses", 20, true, DRESS_COLORS, CLOTHING_SIZES),
            new Sample("Satin Occasion Dress", "Elegant satin dress with a high neckline, made for special days.", "79.99", "Dresses", 8, false, List.of(color("Champagne", "#D8B98F"), color("Mulberry", "#5B3A4A")), CLOTHING_SIZES),
            new Sample("Tie-Back Underscarf", "Keeps your hijab secure and hair in place. Adjustable tie-back.", "6.99", "Accessories", 100, false, List.of(color("Black", "#1F1A1C"), color("Nude", "#D9B8A0"), color("White", "#FAFAF7")), ONE_SIZE),
            new Sample("Pearl Hijab Pins (Set of 6)", "Snag-free pins with a pearl finish.", "8.99", "Accessories", 75, false, List.of(), ONE_SIZE)); // pins: no colour/size choice

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DataSeeder(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            seedEverything();
        } else {
            fillMissingOptions();
        }
    }

    private void seedEverything() {
        category("Hijabs", "Soft, breathable hijabs for every day and every occasion.");
        category("Abayas", "Flowing abayas with clean, elegant lines.");
        category("Dresses", "Modest maxi dresses, from casual to occasion wear.");
        category("Accessories", "Underscarves, pins and the finishing touches.");

        for (Sample s : SAMPLES) {
            Product p = new Product();
            p.setName(s.name());
            p.setSlug(slugify(s.name()));
            p.setDescription(s.description());
            p.setPrice(new BigDecimal(s.price()));
            p.setCategory(categoryRepository.findBySlug(slugify(s.category())).orElseThrow());
            p.setStock(s.stock());
            p.setFeatured(s.featured());
            applyOptions(p, s);
            productRepository.save(p);
        }
    }

    /** For sample products saved before colours/sizes existed: add their options once. */
    private void fillMissingOptions() {
        for (Sample s : SAMPLES) {
            productRepository.findAll().stream().filter(x -> x.getSlug().equals(slugify(s.name()))).findFirst().ifPresent(p -> {
                if (p.getColors().isEmpty() && p.getSizes().isEmpty()) {
                    applyOptions(p, s); // saved automatically at the end of the transaction
                }
            });
        }
    }

    private void applyOptions(Product p, Sample s) {
        s.colors().forEach(c -> p.getColors().add(color(c.getName(), c.getHex())));
        p.getSizes().addAll(s.sizes());
    }

    private void category(String name, String description) {
        categoryRepository.save(new Category(name, slugify(name), description));
    }

    private static ProductColor color(String name, String hex) {
        return new ProductColor(name, hex);
    }

    private static String slugify(String text) {
        return Slugs.slugify(text);
    }
}
