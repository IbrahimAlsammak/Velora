package com.velora.backend.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.velora.backend.dto.DeliveryDtos.DeliveryInfo;
import com.velora.backend.dto.DeliveryDtos.DeliveryUpdate;
import com.velora.backend.entity.DeliverySettings;
import com.velora.backend.repository.DeliverySettingsRepository;

/**
 * Delivery price: ONE fee for every order, wherever it goes in Lebanon (set in the admin panel).
 * Orders of "freeDeliveryOver" or more are delivered free (optional).
 * The price is always calculated HERE, never taken from the customer's browser.
 */
@Service
@Transactional(readOnly = true)
public class DeliveryService {

    private final DeliverySettingsRepository settingsRepository;

    public DeliveryService(DeliverySettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    /** For checkout and the admin page. */
    public DeliveryInfo info() {
        DeliverySettings s = settings();
        return new DeliveryInfo(orZero(s.getFee()), s.getFreeDeliveryOver());
    }

    /** The delivery price for an order with these products. */
    public BigDecimal quote(BigDecimal subtotal) {
        DeliverySettings s = settings();
        if (s.getFreeDeliveryOver() != null && subtotal.compareTo(s.getFreeDeliveryOver()) >= 0) {
            return BigDecimal.ZERO; // free delivery
        }
        return orZero(s.getFee());
    }

    // ----------------- Admin -----------------

    @Transactional
    public DeliveryInfo update(DeliveryUpdate update) {
        DeliverySettings s = settings();
        s.setFee(update.fee());
        s.setFreeDeliveryOver(update.freeDeliveryOver());
        settingsRepository.save(s);
        return info();
    }

    // ----------------- helpers -----------------

    private DeliverySettings settings() {
        return settingsRepository.findById(DeliverySettings.ID).orElseGet(DeliverySettings::new);
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
