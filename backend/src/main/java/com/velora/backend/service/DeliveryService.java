package com.velora.backend.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.DeliveryDtos.CityFeeDto;
import com.velora.backend.dto.DeliveryDtos.CityForm;
import com.velora.backend.dto.DeliveryDtos.DeliveryInfo;
import com.velora.backend.dto.DeliveryDtos.DeliveryUpdate;
import com.velora.backend.dto.DeliveryDtos.Quote;
import com.velora.backend.dto.DeliveryDtos.RegionFeeDto;
import com.velora.backend.entity.CityFee;
import com.velora.backend.entity.DeliverySettings;
import com.velora.backend.entity.Region;
import com.velora.backend.entity.RegionFee;
import com.velora.backend.repository.CityFeeRepository;
import com.velora.backend.repository.DeliverySettingsRepository;
import com.velora.backend.repository.RegionFeeRepository;

/**
 * Delivery prices:
 *  - every AREA has a default price (not set yet = $0)
 *  - a CITY can have its own price, which wins over the area's
 *  - orders of "freeDeliveryOver" or more are delivered free
 * The price is always calculated HERE, never taken from the customer's browser.
 */
@Service
@Transactional(readOnly = true)
public class DeliveryService {

    private final RegionFeeRepository regionFees;
    private final CityFeeRepository cityFees;
    private final DeliverySettingsRepository settings;

    public DeliveryService(RegionFeeRepository regionFees, CityFeeRepository cityFees,
                           DeliverySettingsRepository settings) {
        this.regionFees = regionFees;
        this.cityFees = cityFees;
        this.settings = settings;
    }

    /** For checkout and the admin page. */
    public DeliveryInfo info() {
        List<RegionFeeDto> regions = Arrays.stream(Region.values())
                .map(r -> new RegionFeeDto(r, regionFee(r)))
                .toList();
        List<CityFeeDto> cities = cityFees.findAllByOrderByRegionAscNameAsc().stream().map(CityFeeDto::from).toList();
        return new DeliveryInfo(regions, cities, freeOver());
    }

    /**
     * The delivery price for an order.
     * cityId = a city from the store's list (or null for "Other city" -> the area's default price).
     */
    public Quote quote(Region region, Long cityId, BigDecimal subtotal) {
        BigDecimal fee = regionFee(region);
        String cityName = null;
        if (cityId != null) {
            CityFee city = cityFees.findById(cityId)
                    .filter(c -> c.getRegion() == region)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Please choose your city again."));
            fee = city.getFee();
            cityName = city.getName();
        }
        BigDecimal freeOver = freeOver();
        if (freeOver != null && subtotal.compareTo(freeOver) >= 0) {
            fee = BigDecimal.ZERO; // free delivery
        }
        return new Quote(fee, cityName);
    }

    // ----------------- Admin -----------------

    @Transactional
    public DeliveryInfo update(DeliveryUpdate update) {
        update.regions().forEach(r -> regionFees.save(new RegionFee(r.region(), r.fee())));
        DeliverySettings s = settings.findById(DeliverySettings.ID).orElseGet(DeliverySettings::new);
        s.setFreeDeliveryOver(update.freeDeliveryOver());
        settings.save(s);
        return info();
    }

    @Transactional
    public CityFeeDto addCity(CityForm form) {
        String name = form.name().trim();
        if (cityFees.existsByRegionAndNameIgnoreCase(form.region(), name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, name + " is already in this area's list.");
        }
        CityFee city = new CityFee();
        city.setRegion(form.region());
        city.setName(name);
        city.setFee(form.fee());
        return CityFeeDto.from(cityFees.save(city));
    }

    @Transactional
    public CityFeeDto updateCity(Long id, CityForm form) {
        CityFee city = cityFees.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City not found"));
        city.setRegion(form.region());
        city.setName(form.name().trim());
        city.setFee(form.fee());
        return CityFeeDto.from(city);
    }

    @Transactional
    public void deleteCity(Long id) {
        cityFees.deleteById(id);
    }

    // ----------------- helpers -----------------

    private BigDecimal regionFee(Region region) {
        return regionFees.findById(region).map(RegionFee::getFee).orElse(BigDecimal.ZERO);
    }

    private BigDecimal freeOver() {
        return settings.findById(DeliverySettings.ID).map(DeliverySettings::getFreeDeliveryOver).orElse(null);
    }
}
