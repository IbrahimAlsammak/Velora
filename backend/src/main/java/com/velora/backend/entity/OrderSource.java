package com.velora.backend.entity;

/** Where an order came from. Orders you type in yourself (manual orders) are not WEBSITE. */
public enum OrderSource {
    WEBSITE,   // the customer ordered on the website
    WHATSAPP,  // sold in a WhatsApp chat, entered by you
    INSTAGRAM, // sold in an Instagram chat, entered by you
    OTHER      // sold another way (shop visit, phone call...), entered by you
}
