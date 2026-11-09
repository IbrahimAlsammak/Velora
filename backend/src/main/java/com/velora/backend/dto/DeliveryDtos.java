package com.velora.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.velora.backend.entity.CityFee;
import com.velora.backend.entity.Region;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Data shapes for delivery fees. */
public final class DeliveryDtos {

    private DeliveryDtos() {}

    public record RegionFeeDto(
            @NotNull Region region,
            @NotNull @DecimalMin(value = "0", message = "The fee can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal fee) {}

    public record CityFeeDto(Long id, Region region, String name, BigDecimal fee) {
        public static CityFeeDto from(CityFee c) {
            return new CityFeeDto(c.getId(), c.getRegion(), c.getName(), c.getFee());
        }
    }

    /** Everything checkout needs to show prices (public). */
    public record DeliveryInfo(List<RegionFeeDto> regions, List<CityFeeDto> cities, BigDecimal freeDeliveryOver) {}

    /** Admin saves all area prices + the free-delivery amount at once. */
    public record DeliveryUpdate(
            @NotNull @Valid List<RegionFeeDto> regions,
            @DecimalMin(value = "0", message = "Can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal freeDeliveryOver) {}

    /** Admin adds or edits one city. */
    public record CityForm(
            @NotNull(message = "Choose an area") Region region,
            @NotBlank(message = "Enter the city or town name") @Size(max = 100) String name,
            @NotNull(message = "Enter a price") @DecimalMin(value = "0", message = "The fee can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal fee) {}

    /** The calculated delivery for one order. */
    public record Quote(BigDecimal fee, String cityName) {}
}
