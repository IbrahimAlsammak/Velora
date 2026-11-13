package com.velora.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

/** Data about the shop being open or closed for maintenance. */
public final class StoreDtos {

    private StoreDtos() {
    }

    /** Sent to the website: is the shop closed for maintenance, and since when. */
    public record StoreStatus(boolean maintenance, LocalDateTime maintenanceSince) {}

    /** Sent by the admin panel to switch maintenance on (true) or off (false). */
    public record MaintenanceUpdate(@NotNull Boolean maintenance) {}
}
