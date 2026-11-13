package com.velora.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Settings for the whole shop (maintenance, home banner photos). There is only ever ONE row (id = 1). */
@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
public class StoreSettings {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    /** true = "Under maintenance": customers see a "back soon" page and can't place orders. */
    @Column(nullable = false)
    private boolean maintenance = false;

    /** When maintenance was switched on (empty while the shop is open). */
    private LocalDateTime maintenanceSince;

    /** The home page banner slideshow, in order. Stored in the table "home_slides". */
    @ElementCollection
    @CollectionTable(name = "home_slides", joinColumns = @JoinColumn(name = "settings_id"))
    @OrderColumn(name = "position")
    private List<HomeSlide> slides = new ArrayList<>();
}
