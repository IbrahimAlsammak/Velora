package com.velora.backend.util;

import java.util.Optional;

/**
 * Lebanese phone numbers, all saved in ONE format so the same number always matches:
 *   "03 123 456", "3123456", "+961 3 123 456", "00961 3 123456"  ->  "+9613123456"
 *   "76 569 913", "0096176569913"                                ->  "+96176569913"
 */
public final class Phones {

    private Phones() {}

    /** Returns the standard "+961..." form, or empty if it isn't a valid Lebanese number. */
    public static Optional<String> normalizeLebanese(String input) {
        if (input == null) return Optional.empty();
        String digits = input.replaceAll("[^0-9]", "");   // keep only the numbers

        if (digits.startsWith("00961")) digits = digits.substring(5);
        else if (digits.startsWith("961") && digits.length() >= 10) digits = digits.substring(3);
        if (digits.startsWith("0")) digits = digits.substring(1);   // 03 -> 3, 076 -> 76

        // Lebanese numbers (without the 0) have 7 digits (e.g. 3 123 456) or 8 digits (e.g. 76 569 913)
        if (digits.length() < 7 || digits.length() > 8) return Optional.empty();
        return Optional.of("+961" + digits);
    }
}
