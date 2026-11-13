package com.velora.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.StoreDtos.MaintenanceUpdate;
import com.velora.backend.dto.StoreDtos.StoreStatus;
import com.velora.backend.service.StoreService;

import jakarta.validation.Valid;

/**
 *   GET /api/store/status              -> is the shop open or closed for maintenance? (public)
 *   PUT /api/admin/store/maintenance   -> switch maintenance on / off (admin)
 */
@RestController
public class StoreController {

    private final StoreService store;

    public StoreController(StoreService store) {
        this.store = store;
    }

    @GetMapping("/api/store/status")
    public StoreStatus status() {
        return store.status();
    }

    @PutMapping("/api/admin/store/maintenance")
    public StoreStatus setMaintenance(@Valid @RequestBody MaintenanceUpdate update) {
        return store.setMaintenance(update.maintenance());
    }
}
