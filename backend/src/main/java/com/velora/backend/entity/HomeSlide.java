package com.velora.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One photo of the home page banner slideshow. Stored as a row in the table "home_slides". */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomeSlide {

    /** The photo (uploaded in the admin panel), e.g. /uploads/abc.jpg */
    @Column(nullable = false, length = 255)
    private String imageUrl;

    /** Short text shown at the bottom of the photo, e.g. "New abayas". Empty = no text. */
    @Column(length = 80)
    private String caption;

    /** Where a click on the photo leads, e.g. /shop or /shop?category=abayas. Empty = nowhere. */
    @Column(length = 200)
    private String link;
}
