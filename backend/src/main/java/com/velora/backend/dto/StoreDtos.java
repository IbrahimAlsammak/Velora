package com.velora.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.velora.backend.entity.HomeSlide;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Data about the shop being open or closed for maintenance. */
public final class StoreDtos {

    private StoreDtos() {
    }

    /** Sent to the website: is the shop closed for maintenance, and since when. */
    public record StoreStatus(boolean maintenance, LocalDateTime maintenanceSince) {}

    /** Sent by the admin panel to switch maintenance on (true) or off (false). */
    public record MaintenanceUpdate(@NotNull Boolean maintenance) {}

    /** One banner photo, sent to and from the website. */
    public record SlideDto(
            @NotBlank @Size(max = 255) String imageUrl,
            @Size(max = 80, message = "Keep the text under 80 characters") String caption,
            // only links inside the shop (starting with /), e.g. /shop?category=abayas
            @Size(max = 200) @Pattern(regexp = "^(/.*)?$", message = "Link must start with /") String link) {

        public static SlideDto from(HomeSlide s) {
            return new SlideDto(s.getImageUrl(), s.getCaption(), s.getLink());
        }
    }

    /** The whole slideshow, saved at once from the admin panel. */
    public record SlidesUpdate(@NotNull @Size(max = 10, message = "Up to 10 photos") List<@Valid SlideDto> slides) {}
}
