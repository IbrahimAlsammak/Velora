package com.velora.backend.service;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.DeliveryDtos.CityFeeDto;
import com.velora.backend.dto.DeliveryDtos.CityForm;
import com.velora.backend.dto.DeliveryDtos.DeliveryInfo;
import com.velora.backend.dto.DeliveryDtos.DeliveryUpdate;
import com.velora.backend.dto.DeliveryDtos.Quote;
import com.velora.backend.entity.CityFee;
import com.velora.backend.entity.DeliverySettings;
import com.velora.backend.repository.CityFeeRepository;
import com.velora.backend.repository.DeliverySettingsRepository;

/**
 * Delivery prices by CITY:
 *  - each city in the list has its own price
 *  - any other city pays the "other cities" price
 *  - orders of "freeDeliveryOver" or more are delivered free
 * The price is always calculated HERE, never taken from the customer's browser.
 */
@Service
@Transactional(readOnly = true)
public class DeliveryService {

    private final CityFeeRepository cityFees;
    private final DeliverySettingsRepository settingsRepository;

    public DeliveryService(CityFeeRepository cityFees, DeliverySettingsRepository settingsRepository) {
        this.cityFees = cityFees;
        this.settingsRepository = settingsRepository;
    }

    /** For checkout and the admin page. */
    public DeliveryInfo info() {
        DeliverySettings s = settings();
        return new DeliveryInfo(
                cityFees.findAllByOrderByNameAsc().stream().map(CityFeeDto::from).toList(),
                orZero(s.getOtherCitiesFee()),
                s.getFreeDeliveryOver());
    }

    /**
     * The delivery price for an order.
     * cityId = a city from the list, or null for "Other city" (-> the "other cities" price).
     */
    public Quote quote(Long cityId, BigDecimal subtotal) {
        DeliverySettings s = settings();
        BigDecimal fee = orZero(s.getOtherCitiesFee());
        String cityName = null;
        if (cityId != null) {
            CityFee city = cityFees.findById(cityId).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose your city again."));
            fee = city.getFee();
            cityName = city.getName();
        }
        if (s.getFreeDeliveryOver() != null && subtotal.compareTo(s.getFreeDeliveryOver()) >= 0) {
            fee = BigDecimal.ZERO; // free delivery
        }
        return new Quote(fee, cityName);
    }

    // ----------------- Admin -----------------

    @Transactional
    public DeliveryInfo update(DeliveryUpdate update) {
        DeliverySettings s = settings();
        s.setOtherCitiesFee(update.otherCitiesFee());
        s.setFreeDeliveryOver(update.freeDeliveryOver());
        settingsRepository.save(s);
        return info();
    }

    @Transactional
    public CityFeeDto addCity(CityForm form) {
        String name = form.name().trim();
        if (cityFees.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, name + " is already in the list.");
        }
        CityFee city = new CityFee();
        city.setName(name);
        city.setFee(form.fee());
        return CityFeeDto.from(cityFees.save(city));
    }

    @Transactional
    public CityFeeDto updateCity(Long id, CityForm form) {
        CityFee city = cityFees.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City not found"));
        String name = form.name().trim();
        if (!city.getName().equalsIgnoreCase(name) && cityFees.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, name + " is already in the list.");
        }
        city.setName(name);
        city.setFee(form.fee());
        return CityFeeDto.from(city);
    }

    @Transactional
    public void deleteCity(Long id) {
        cityFees.deleteById(id);
    }

    // ----------------- helpers -----------------

    private DeliverySettings settings() {
        return settingsRepository.findById(DeliverySettings.ID).orElseGet(DeliverySettings::new);
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
