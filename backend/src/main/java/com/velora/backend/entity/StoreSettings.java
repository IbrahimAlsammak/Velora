package com.velora.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Settings for the whole shop. There is only ever ONE row (id = 1). */
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
}
