package com.velora.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.StoreDtos.SlideDto;
import com.velora.backend.dto.StoreDtos.StoreStatus;
import com.velora.backend.entity.HomeSlide;
import com.velora.backend.entity.StoreSettings;
import com.velora.backend.repository.StoreSettingsRepository;

/** Opens and closes the shop ("Under maintenance"). */
@Service
public class StoreService {

    private final StoreSettingsRepository settingsRepository;

    public StoreService(StoreSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public StoreStatus status() {
        StoreSettings s = settings();
        return new StoreStatus(s.isMaintenance(), s.getMaintenanceSince());
    }

    @Transactional
    public StoreStatus setMaintenance(boolean on) {
        StoreSettings s = settings();
        if (s.isMaintenance() != on) {
            s.setMaintenance(on);
            s.setMaintenanceSince(on ? LocalDateTime.now() : null);
            settingsRepository.save(s);
        }
        return status();
    }

    /** The home page banner photos, in order. */
    @Transactional(readOnly = true)
    public List<SlideDto> slides() {
        return settings().getSlides().stream().map(SlideDto::from).toList();
    }

    /** Replaces the whole slideshow with the list from the admin panel. */
    @Transactional
    public List<SlideDto> saveSlides(List<SlideDto> slides) {
        StoreSettings s = settings();
        s.getSlides().clear();
        for (SlideDto d : slides) {
            s.getSlides().add(new HomeSlide(d.imageUrl().trim(), blankToNull(d.caption()), blankToNull(d.link())));
        }
        settingsRepository.save(s);
        return slides();
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    /** Called before saving a new order: refuses it while the shop is closed. */
    public void checkOpenForOrders() {
        if (settings().isMaintenance()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The shop is closed for a short update. Your bag is saved - please try again soon.");
        }
    }

    /** The settings row, or default settings (shop open) if it was never saved. */
    private StoreSettings settings() {
        return settingsRepository.findById(StoreSettings.ID).orElseGet(StoreSettings::new);
    }
}
