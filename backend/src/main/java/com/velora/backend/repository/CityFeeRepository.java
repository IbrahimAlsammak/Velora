package com.velora.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.velora.backend.entity.CityFee;

/** Cities with their delivery price. */
public interface CityFeeRepository extends JpaRepository<CityFee, Long> {

    List<CityFee> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
