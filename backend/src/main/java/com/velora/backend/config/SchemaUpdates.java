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

        // Delivery now works by city only - remove the old "area" column from the city list (keeps the cities)
        try {
            jdbc.execute("ALTER TABLE delivery_city_fees DROP COLUMN region");
        } catch (Exception alreadyRemoved) {
            // nothing to do
        }
        jdbc.execute("DROP TABLE IF EXISTS delivery_region_fees");

        // Products can now be deleted even if they were ordered - old order lines then lose the link
        jdbc.execute("ALTER TABLE order_items MODIFY product_id BIGINT NULL");
    }
}
