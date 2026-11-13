package com.velora.backend.notify;

/**
 * "A new order was placed" - announced by OrderService, heard by TelegramNotifier.
 * It carries the ready-made message text, so the sender doesn't need the database.
 */
public record NewOrderEvent(String message) {}
