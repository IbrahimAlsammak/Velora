package com.velora.backend.entity;

/** How the customer chose to pay. */
public enum PaymentMethod {
    CASH_ON_DELIVERY, // pays the delivery person
    WHISH_TRANSFER    // sends the money to the store's Whish number, with the order number in the note
}
