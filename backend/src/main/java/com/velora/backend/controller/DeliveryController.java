package com.velora.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.DeliveryDtos.DeliveryInfo;
import com.velora.backend.dto.DeliveryDtos.DeliveryUpdate;
import com.velora.backend.service.DeliveryService;

import jakarta.validation.Valid;

/**
 *   GET /api/delivery         -> the delivery fee for checkout (public)
 *   PUT /api/admin/delivery   -> save the delivery fee + free-delivery amount (admin)
 */
@RestController
public class DeliveryController {

    private final DeliveryService delivery;

    public DeliveryController(DeliveryService delivery) {
        this.delivery = delivery;
    }

    @GetMapping("/api/delivery")
    public DeliveryInfo info() {
        return delivery.info();
    }

    @PutMapping("/api/admin/delivery")
    public DeliveryInfo update(@Valid @RequestBody DeliveryUpdate update) {
        return delivery.update(update);
    }
}
