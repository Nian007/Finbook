package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.Business;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRepository extends JpaRepository<Business, Long> {
}
