package com.velora.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.StoreDtos.MaintenanceUpdate;
import com.velora.backend.dto.StoreDtos.SlideDto;
import com.velora.backend.dto.StoreDtos.SlidesUpdate;
import com.velora.backend.dto.StoreDtos.StoreStatus;
import com.velora.backend.service.StoreService;

import jakarta.validation.Valid;

/**
 *   GET /api/store/status              -> is the shop open or closed for maintenance? (public)
 *   PUT /api/admin/store/maintenance   -> switch maintenance on / off (admin)
 *   GET /api/store/slides              -> the home page banner photos (public)
 *   PUT /api/admin/store/slides        -> save the banner photos (admin)
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

    @GetMapping("/api/store/slides")
    public List<SlideDto> slides() {
        return store.slides();
    }

    @PutMapping("/api/admin/store/slides")
    public List<SlideDto> saveSlides(@Valid @RequestBody SlidesUpdate update) {
        return store.saveSlides(update.slides());
    }

    @PutMapping("/api/admin/store/maintenance")
    public StoreStatus setMaintenance(@Valid @RequestBody MaintenanceUpdate update) {
        return store.setMaintenance(update.maintenance());
    }
}
