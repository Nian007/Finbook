package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    @Query("SELECT s FROM Sale s WHERE s.business.id = :businessId AND (LOWER(s.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Sale> search(@Param("businessId") Long businessId, @Param("query") String query);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.business.id = :businessId AND s.createdAt >= :start")
    Long countSalesSince(@Param("businessId") Long businessId, @Param("start") LocalDateTime start);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.business.id = :businessId")
    Long countSalesAllTime(@Param("businessId") Long businessId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.business.id = :businessId AND s.createdAt >= :start")
    BigDecimal totalRevenueSince(@Param("businessId") Long businessId, @Param("start") LocalDateTime start);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.business.id = :businessId")
    BigDecimal totalRevenueAllTime(@Param("businessId") Long businessId);

    Optional<Sale> findByIdAndBusinessId(Long id, Long businessId);

    List<Sale> findTop10ByBusinessIdOrderByCreatedAtDesc(Long businessId);
}
