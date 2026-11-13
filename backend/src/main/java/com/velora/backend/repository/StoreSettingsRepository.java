package com.velora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.StoreSettings;

/** The single row of shop-wide settings (maintenance on/off). */
public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}
