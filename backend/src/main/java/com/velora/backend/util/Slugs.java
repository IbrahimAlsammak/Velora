package com.velora.backend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/** Makes URL-friendly names: "Pearl Hijab Pins (Set of 6)" -> "pearl-hijab-pins-set-of-6" */
public final class Slugs {

    private Slugs() {}

    public static String slugify(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "item" : slug;
    }

    /** If "black-abaya" is taken, try "black-abaya-2", "black-abaya-3"... */
    public static String unique(String text, Predicate<String> isTaken) {
        String base = slugify(text);
        String candidate = base;
        for (int n = 2; isTaken.test(candidate); n++) {
            candidate = base + "-" + n;
        }
        return candidate;
    }
}
