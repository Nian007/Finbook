package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.Subscription;
import com.shopkeeper.sales.model.Subscription.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    // Get the most recent subscription for a business
    Optional<Subscription> findTopByBusinessIdOrderByCreatedAtDesc(Long businessId);

    // Get active or trial subscription
    Optional<Subscription> findTopByBusinessIdAndStatusInOrderByEndDateDesc(Long businessId, List<Status> statuses);

    // All pending verifications (for admin panel)
    List<Subscription> findByStatusOrderByCreatedAtAsc(Status status);

    // Find subscriptions that have expired (for the nightly cleanup job)
    @Query("SELECT s FROM Subscription s WHERE s.status IN ('ACTIVE', 'TRIAL') AND s.endDate < :now")
    List<Subscription> findExpiredSubscriptions(LocalDateTime now);
}
