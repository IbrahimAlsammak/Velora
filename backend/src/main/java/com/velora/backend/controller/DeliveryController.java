package com.velora.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.DeliveryDtos.CityFeeDto;
import com.velora.backend.dto.DeliveryDtos.CityForm;
import com.velora.backend.dto.DeliveryDtos.DeliveryInfo;
import com.velora.backend.dto.DeliveryDtos.DeliveryUpdate;
import com.velora.backend.service.DeliveryService;

import jakarta.validation.Valid;

/**
 *   GET    /api/delivery                     -> prices for checkout (public)
 *   PUT    /api/admin/delivery               -> save area prices + free-delivery amount (admin)
 *   POST   /api/admin/delivery/cities        -> add a city with its own price (admin)
 *   PUT    /api/admin/delivery/cities/{id}   -> edit a city (admin)
 *   DELETE /api/admin/delivery/cities/{id}   -> remove a city (admin)
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

    @PostMapping("/api/admin/delivery/cities")
    @ResponseStatus(HttpStatus.CREATED)
    public CityFeeDto addCity(@Valid @RequestBody CityForm form) {
        return delivery.addCity(form);
    }

    @PutMapping("/api/admin/delivery/cities/{id}")
    public CityFeeDto updateCity(@PathVariable Long id, @Valid @RequestBody CityForm form) {
        return delivery.updateCity(id, form);
    }

    @DeleteMapping("/api/admin/delivery/cities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCity(@PathVariable Long id) {
        delivery.deleteCity(id);
    }
}
