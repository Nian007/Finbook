package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.SubscriptionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionAuditLogRepository extends JpaRepository<SubscriptionAuditLog, Long> {
    List<SubscriptionAuditLog> findBySubscriptionIdOrderByTimestampDesc(Long subscriptionId);
    List<SubscriptionAuditLog> findTop100ByOrderByTimestampDesc();
}
