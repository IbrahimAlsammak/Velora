package com.velora.backend.entity;

/** The journey of an order. "enum" = a fixed list of allowed values. */
public enum OrderStatus {
    PENDING,    // placed, waiting for payment (payments come in a later step)
    PAID,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
