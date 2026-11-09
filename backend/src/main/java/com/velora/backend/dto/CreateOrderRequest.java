package com.velora.backend.dto;

import java.util.List;

import com.velora.backend.entity.PaymentMethod;
import com.velora.backend.entity.Region;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the checkout form sends. The @ rules are checked automatically
 * BEFORE our code runs (that's the "validation" tool we added in Step 1).
 * Note: NO prices here - the backend looks prices up itself.
 */
public record CreateOrderRequest(
        @NotBlank(message = "Please enter your full name") @Size(max = 120) String customerName,
        @NotBlank(message = "Please enter your phone number") @Size(max = 30) String phone, // checked in OrderService
        @NotNull(message = "Please choose your area") Region region,
        @NotBlank(message = "Please enter your city or town") @Size(max = 100) String city,
        Long cityId, // a city from the store's delivery list (empty = "Other city" -> area price)
        @NotBlank(message = "Please enter your street or neighbourhood") @Size(max = 250) String addressLine,
        @Size(max = 120) String building,
        @Size(max = 30) String floor,
        @Size(max = 200) String landmark,
        @Size(max = 500) String notes,
        @NotNull(message = "Please choose how you'd like to pay") PaymentMethod paymentMethod,
        @NotEmpty(message = "Your bag is empty") @Size(max = 50) List<@Valid Item> items) {

    public record Item(
            @NotNull Long productId,
            String color,
            String size,
            @Min(1) @Max(10) int quantity) {}
}
