package com.velora.backend.notify;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;

/**
 * Sends a message to the store owner's phone through a Telegram bot.
 *
 * The bot token and chat id live in application-secrets.properties (never uploaded):
 *   velora.telegram.bot-token=...   (from @BotFather in Telegram)
 *   velora.telegram.chat-id=...     (your own chat with the bot)
 * If they are empty, nothing is sent - the shop works exactly the same.
 */
@Service
public class TelegramNotifier {

    private static final Logger log = LoggerFactory.getLogger(TelegramNotifier.class);

    private final String botToken;
    private final String chatId;
    private final RestClient http = RestClient.create("https://api.telegram.org");

    public TelegramNotifier(@Value("${velora.telegram.bot-token:}") String botToken,
                            @Value("${velora.telegram.chat-id:}") String chatId) {
        this.botToken = botToken.trim();
        this.chatId = chatId.trim();
    }

    /** Are the bot token and chat id filled in? */
    public boolean isConfigured() {
        return !botToken.isEmpty() && !chatId.isEmpty();
    }

    /**
     * Runs only AFTER the order is really saved (AFTER_COMMIT), and in the background (@Async),
     * so the customer never waits for Telegram - and a Telegram problem can never break an order.
     */
    @Async
    @TransactionalEventListener
    public void onNewOrder(NewOrderEvent event) {
        send(event.message());
    }

    /** Sends one message. Returns true if Telegram accepted it. */
    public boolean send(String text) {
        if (!isConfigured()) {
            return false;
        }
        try {
            http.post()
                    .uri("/bot{token}/sendMessage", botToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("chat_id", chatId, "text", text))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            // Log the reason only (never the token)
            log.warn("Telegram message not sent: {}", e.getClass().getSimpleName());
            return false;
        }
    }
}
