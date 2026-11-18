package com.velora.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

/** Data shapes for the delivery fee (one fee for all of Lebanon). */
public final class DeliveryDtos {

    private DeliveryDtos() {}

    /** What checkout needs to show the price (public). freeDeliveryOver = null -> never free. */
    public record DeliveryInfo(BigDecimal fee, BigDecimal freeDeliveryOver) {}

    /** Admin saves the delivery fee + the free-delivery amount. */
    public record DeliveryUpdate(
            @NotNull(message = "Enter a delivery fee (0 for free)") @DecimalMin(value = "0", message = "Can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal fee,
            @DecimalMin(value = "0", message = "Can't be negative")
            @Digits(integer = 6, fraction = 2) BigDecimal freeDeliveryOver) {}
}
