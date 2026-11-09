package com.velora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.Region;
import com.velora.backend.entity.RegionFee;

/** Default delivery price per area. The "ID" of each row is the area itself (BEIRUT, NORTH...). */
public interface RegionFeeRepository extends JpaRepository<RegionFee, Region> {
}
