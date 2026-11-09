package com.velora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.DeliverySettings;

/** The single row of store-wide delivery settings (free delivery over $X). */
public interface DeliverySettingsRepository extends JpaRepository<DeliverySettings, Long> {
}
