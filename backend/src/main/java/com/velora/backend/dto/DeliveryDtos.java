package com.velora.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.velora.backend.entity.CityFee;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Data shapes for delivery fees (by city). */
public final class DeliveryDtos {

    private DeliveryDtos() {}

    public record CityFeeDto(Long id, String name, BigDecimal fee) {
        public static CityFeeDto from(CityFee c) {
            return new CityFeeDto(c.getId(), c.getName(), c.getFee());
        }
    }

    /** Everything checkout needs to show prices (public). */
    public record DeliveryInfo(List<CityFeeDto> cities, BigDecimal otherCitiesFee, BigDecimal freeDeliveryOver) {}

    /** Admin saves the "other cities" price + the free-delivery amount. */
    public record DeliveryUpdate(
            @NotNull(message = "Enter a price") @DecimalMin(value = "0", message = "Can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal otherCitiesFee,
            @DecimalMin(value = "0", message = "Can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal freeDeliveryOver) {}

    /** Admin adds or edits one city. */
    public record CityForm(
            @NotBlank(message = "Enter the city or town name") @Size(max = 100) String name,
            @NotNull(message = "Enter a price") @DecimalMin(value = "0", message = "The price can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal fee) {}

    /** The calculated delivery for one order. */
    public record Quote(BigDecimal fee, String cityName) {}
}
