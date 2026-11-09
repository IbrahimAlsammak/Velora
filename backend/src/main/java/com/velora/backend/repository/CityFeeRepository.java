package com.velora.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.CityFee;
import com.velora.backend.entity.Region;

/** Cities with their own delivery price. */
public interface CityFeeRepository extends JpaRepository<CityFee, Long> {

    List<CityFee> findAllByOrderByRegionAscNameAsc();

    boolean existsByRegionAndNameIgnoreCase(Region region, String name);
}
