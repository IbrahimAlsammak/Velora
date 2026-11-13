package com.velora.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.notify.TelegramNotifier;

/**
 *   GET  /api/admin/notifications/telegram        -> is the Telegram bot set up? (admin)
 *   POST /api/admin/notifications/telegram/test   -> send a test message to your phone (admin)
 */
@RestController
public class NotificationController {

    private final TelegramNotifier telegram;

    public NotificationController(TelegramNotifier telegram) {
        this.telegram = telegram;
    }

    @GetMapping("/api/admin/notifications/telegram")
    public Map<String, Boolean> status() {
        return Map.of("configured", telegram.isConfigured());
    }

    @PostMapping("/api/admin/notifications/telegram/test")
    public Map<String, Boolean> test() {
        boolean sent = telegram.send("✅ Velora test message\n\nNew orders will arrive here like this. 🛍️");
        return Map.of("sent", sent);
    }
}
