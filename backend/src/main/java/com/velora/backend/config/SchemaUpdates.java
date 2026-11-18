package com.velora.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small database changes that Hibernate's automatic "update" can't do by itself.
 * (It adds new columns, but never makes an existing column optional.)
 * Each line is safe to run again and again.
 */
@Component
@Order(0) // run before the other start-up tasks
public class SchemaUpdates implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    public SchemaUpdates(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        // Customers now use their phone number - email became optional
        jdbc.execute("ALTER TABLE users MODIFY email VARCHAR(160) NULL");
        jdbc.execute("ALTER TABLE orders MODIFY email VARCHAR(160) NULL");

        // Delivery is now ONE fee for all of Lebanon - the old area and city price lists are removed
        jdbc.execute("DROP TABLE IF EXISTS delivery_region_fees");
        jdbc.execute("DROP TABLE IF EXISTS delivery_city_fees");

        // Products can now be deleted even if they were ordered - old order lines then lose the link
        jdbc.execute("ALTER TABLE order_items MODIFY product_id BIGINT NULL");

        // Manual orders (sold on WhatsApp / Instagram) may have no phone or address
        jdbc.execute("ALTER TABLE orders MODIFY phone VARCHAR(30) NULL");
        jdbc.execute("ALTER TABLE orders MODIFY city VARCHAR(100) NULL");
        jdbc.execute("ALTER TABLE orders MODIFY address_line VARCHAR(250) NULL");
    }
}
