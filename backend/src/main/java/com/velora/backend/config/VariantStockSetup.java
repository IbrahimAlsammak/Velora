package com.velora.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.velora.backend.entity.Product;
import com.velora.backend.repository.ProductRepository;

/**
 * Runs at start-up. Products made BEFORE "stock per colour + size" existed have one stock number only.
 * This gives each of them a stock row per colour + size: all its current stock goes on the FIRST
 * combination (e.g. Black / S), the others start at 0 - then you share it out in the admin panel.
 * Products that already have their rows are not touched, so this only ever changes a product once.
 */
@Component
@Order(100) // after the sample data (if any) is created
public class VariantStockSetup implements CommandLineRunner {

    private final ProductRepository productRepository;

    public VariantStockSetup(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (Product p : productRepository.findAll()) {
            if (p.hasOptions() && p.getVariants().isEmpty()) {
                p.createVariants(p.getStock()); // saved automatically at the end
            }
        }
    }
}
