package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByBusinessIdAndIsActiveTrueOrderByNameAsc(Long businessId);

    Optional<InventoryItem> findByIdAndBusinessId(Long id, Long businessId);

    @Query("SELECT i FROM InventoryItem i WHERE i.business.id = :businessId AND i.isActive = true " +
           "AND LOWER(i.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<InventoryItem> searchByBusinessIdAndName(@Param("businessId") Long businessId,
                                                  @Param("query") String query);
}
