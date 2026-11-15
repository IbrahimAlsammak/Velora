package com.velora.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Login protection: stops someone from guessing passwords by trying again and again.
 *   - 5 wrong passwords for the same account within 15 minutes -> that account is paused for 15 minutes
 *   - 20 wrong passwords from the same internet address (IP) within 15 minutes -> that address is paused
 * Kept in memory (a restart clears it) - simple and enough for one server.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_PER_ACCOUNT = 5;
    private static final int MAX_PER_ADDRESS = 20;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    /** "account:..." or "ip:..." -> times of the recent wrong attempts */
    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    /** Throws "429 Too many attempts" if this account or address is paused right now. */
    public void checkAllowed(String account, String address) {
        long wait = Math.max(
                waitSeconds("account:" + account, MAX_PER_ACCOUNT),
                waitSeconds("ip:" + address, MAX_PER_ADDRESS));
        if (wait > 0) {
            long minutes = Math.max(1, (wait + 59) / 60);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many wrong attempts. Please wait " + minutes + " minute" + (minutes == 1 ? "" : "s")
                            + " and try again.");
        }
    }

    public void recordFailure(String account, String address) {
        add("account:" + account);
        add("ip:" + address);
    }

    /** Right password: forget the wrong attempts of this account. */
    public void recordSuccess(String account) {
        failures.remove("account:" + account);
    }

    private void add(String key) {
        failures.compute(key, (k, times) -> {
            Deque<Instant> list = times == null ? new ArrayDeque<>() : times;
            list.addLast(Instant.now());
            return list;
        });
    }

    /** How many seconds this key must still wait (0 = allowed). Also forgets attempts older than 15 minutes. */
    private long waitSeconds(String key, int max) {
        Deque<Instant> times = failures.get(key);
        if (times == null) return 0;
        synchronized (times) {
            Instant cutoff = Instant.now().minus(WINDOW);
            while (!times.isEmpty() && times.peekFirst().isBefore(cutoff)) times.pollFirst();
            if (times.isEmpty()) {
                failures.remove(key, times);
                return 0;
            }
            if (times.size() < max) return 0;
            // paused until the oldest counted attempt is 15 minutes old
            return Duration.between(Instant.now(), times.peekFirst().plus(WINDOW)).toSeconds();
        }
    }
}
