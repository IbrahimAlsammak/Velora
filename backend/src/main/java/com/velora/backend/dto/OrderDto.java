package com.velora.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.velora.backend.entity.Order;

/** The order as the website sees it (confirmation page). */
public record OrderDto(
        String orderNumber,
        String status,
        String paymentMethod,
        Instant createdAt,
        String customerName,
        String phone,
        String city,
        String region,
        String country,
        List<Line> items,
        BigDecimal subtotal,
        BigDecimal shippingCost,
        BigDecimal total) {

    public record Line(String productName, String color, String size, int quantity,
                       BigDecimal unitPrice, BigDecimal lineTotal) {}

    public static OrderDto from(Order o) {
        return new OrderDto(
                o.getOrderNumber(),
                o.getStatus().name(),
                o.getPaymentMethod().name(),
                o.getCreatedAt(),
                o.getCustomerName(),
                o.getPhone(),
                o.getCity(),
                o.getRegion() == null ? null : o.getRegion().name(),
                o.getCountry(),
                o.getItems().stream()
                        .map(i -> new Line(i.getProductName(), i.getColor(), i.getSize(), i.getQuantity(),
                                i.getUnitPrice(), i.getLineTotal()))
                        .toList(),
                o.getSubtotal(),
                o.getShippingCost(),
                o.getTotal());
    }
}
