package com.velora.backend.controller;

import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/health -> tells us the server is running and whether MySQL is reachable. */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "UP");
        result.put("app", "Velora");
        try (Connection conn = dataSource.getConnection()) {
            result.put("database", conn.getCatalog() + " connected");
        } catch (Exception e) {
            result.put("database", "NOT connected: " + e.getMessage());
        }
        return result;
    }
}
