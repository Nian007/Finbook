package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    
    interface ProductProjection {
        String getName();
        java.math.BigDecimal getPrice();
    }

    @Query("SELECT i.productName as name, MAX(i.unitPrice) as price FROM SaleItem i WHERE i.sale.business.id = :businessId GROUP BY i.productName")
    List<ProductProjection> findDistinctProductsByBusinessId(@Param("businessId") Long businessId);
}
