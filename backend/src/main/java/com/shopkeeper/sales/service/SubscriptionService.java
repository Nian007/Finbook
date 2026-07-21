package com.shopkeeper.sales.service;

import com.shopkeeper.sales.model.*;
import com.shopkeeper.sales.model.Subscription.Status;
import com.shopkeeper.sales.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SubscriptionService {

    // UPI ID for payment instructions
    public static final String UPI_ID = "angralnikhil99@okhdfcbank";
    public static final String UPI_NAME = "Finbook";

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionAuditLogRepository auditLogRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private UserRepository userRepository;

    // ─── Plans ───────────────────────────────────────────────────────────────────

    public List<SubscriptionPlan> getActivePlans() {
        return planRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    // ─── Current Subscription Status ─────────────────────────────────────────────

    public Optional<Subscription> getActiveSubscription(Long businessId) {
        return subscriptionRepository.findTopByBusinessIdAndStatusInOrderByEndDateDesc(
            businessId, List.of(Status.ACTIVE, Status.TRIAL)
        );
    }

    public Optional<Subscription> getLatestSubscription(Long businessId) {
        return subscriptionRepository.findTopByBusinessIdOrderByCreatedAtDesc(businessId);
    }

    /**
     * Returns the subscription state for the frontend:
     * - ACTIVE / TRIAL → allowed
     * - EXPIRED / CANCELLED / PENDING_VERIFICATION / none → blocked
     * Also returns whether a "1-day expiry warning" should be shown.
     */
    public SubscriptionStatusResult checkSubscriptionStatus(Long businessId) {
        Optional<Subscription> activeSub = getActiveSubscription(businessId);
        if (activeSub.isEmpty()) {
            Optional<Subscription> latest = getLatestSubscription(businessId);
            String latestStatus = latest.map(s -> s.getStatus().name()).orElse("NONE");
            return new SubscriptionStatusResult(false, false, latestStatus, null);
        }

        Subscription sub = activeSub.get();
        boolean expiresWithin24h = sub.getEndDate() != null &&
            sub.getEndDate().isBefore(LocalDateTime.now().plusHours(25));

        return new SubscriptionStatusResult(true, expiresWithin24h, sub.getStatus().name(), sub);
    }

    // ─── Initiate Subscription (User Flow) ───────────────────────────────────────

    public Subscription initiatePendingSubscription(Long businessId, Long planId) {
        Business business = businessRepository.findById(businessId)
            .orElseThrow(() -> new RuntimeException("Business not found"));
        SubscriptionPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Plan not found"));

        Subscription sub = new Subscription();
        sub.setBusiness(business);
        sub.setPlan(plan);
        sub.setStatus(Status.PENDING_VERIFICATION);
        sub.setPaymentProvider("MANUAL_UPI");
        Subscription saved = subscriptionRepository.save(sub);

        writeAuditLog(saved, null, "PENDING_VERIFICATION", null,
            "User initiated UPI payment for plan: " + plan.getName());
        return saved;
    }

    public Subscription submitUTR(Long subscriptionId, String utrNumber, Long businessId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
            .orElseThrow(() -> new RuntimeException("Subscription not found"));
        if (!sub.getBusiness().getId().equals(businessId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (sub.getStatus() != Status.PENDING_VERIFICATION) {
            throw new RuntimeException("Subscription is not pending verification");
        }
        if (utrNumber == null || utrNumber.isBlank()) {
            throw new RuntimeException("UTR number cannot be empty");
        }
        sub.setUtrNumber(utrNumber.trim());
        Subscription saved = subscriptionRepository.save(sub);

        writeAuditLog(saved, "PENDING_VERIFICATION", "PENDING_VERIFICATION", null,
            "User submitted UTR: " + utrNumber);
        return saved;
    }

    // ─── Admin Actions ────────────────────────────────────────────────────────────

    public Subscription adminActivateSubscription(Long subscriptionId, Long adminUserId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
            .orElseThrow(() -> new RuntimeException("Subscription not found"));

        String previousStatus = sub.getStatus().name();
        sub.setStatus(Status.ACTIVE);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusDays(sub.getPlan().getDurationDays()));
        Subscription saved = subscriptionRepository.save(sub);

        // Update the business subscription status for fast reads
        Business biz = saved.getBusiness();
        biz.setSubscriptionStatus("ACTIVE");
        businessRepository.save(biz);

        String adminPhone = userRepository.findById(adminUserId)
            .map(User::getPhone).orElse("unknown");
        writeAuditLog(saved, previousStatus, "ACTIVE", adminUserId,
            "Admin activated subscription. UTR: " + sub.getUtrNumber() + " | Admin: " + adminPhone);
        return saved;
    }

    public Subscription grantFreeTrial(Long businessId, int durationDays, Long adminUserId, String note) {
        Business business = businessRepository.findById(businessId)
            .orElseThrow(() -> new RuntimeException("Business not found"));

        Subscription sub = new Subscription();
        sub.setBusiness(business);
        sub.setPlan(null); // No plan for free trials
        sub.setStatus(Status.TRIAL);
        sub.setPaymentProvider("TRIAL");
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusDays(durationDays));
        sub.setGrantedByUserId(adminUserId);
        sub.setGrantNote(note);
        Subscription saved = subscriptionRepository.save(sub);

        business.setSubscriptionStatus("TRIAL");
        businessRepository.save(business);

        String adminPhone = userRepository.findById(adminUserId)
            .map(User::getPhone).orElse("unknown");
        writeAuditLog(saved, null, "TRIAL", adminUserId,
            "Admin granted " + durationDays + "-day free trial. Admin: " + adminPhone +
            ". Note: " + (note != null ? note : "—"));
        return saved;
    }

    public List<Subscription> getPendingVerifications() {
        return subscriptionRepository.findByStatusOrderByCreatedAtAsc(Status.PENDING_VERIFICATION);
    }

    public List<SubscriptionAuditLog> getAuditLog() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    // ─── Scheduled Expiry Job ─────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 1 * * *") // Runs at 1:00 AM every day
    public void expireOldSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        for (Subscription sub : expired) {
            String prevStatus = sub.getStatus().name();
            sub.setStatus(Status.EXPIRED);
            subscriptionRepository.save(sub);

            sub.getBusiness().setSubscriptionStatus("EXPIRED");
            businessRepository.save(sub.getBusiness());

            writeAuditLog(sub, prevStatus, "EXPIRED", null, "Auto-expired by scheduled job");
        }
        if (!expired.isEmpty()) {
            System.out.println("[Scheduler] Expired " + expired.size() + " subscriptions");
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private void writeAuditLog(Subscription sub, String prev, String next, Long adminId, String note) {
        SubscriptionAuditLog log = new SubscriptionAuditLog();
        log.setSubscription(sub);
        log.setPreviousStatus(prev);
        log.setNewStatus(next);
        log.setPerformedByUserId(adminId);
        log.setNote(note);
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(u -> log.setPerformedByPhone(u.getPhone()));
        }
        auditLogRepository.save(log);
    }

    // ─── Inner Result DTO ────────────────────────────────────────────────────────

    public static class SubscriptionStatusResult {
        public final boolean isAllowed;
        public final boolean expiresWithin24h;
        public final String status;
        public final Subscription subscription;

        public SubscriptionStatusResult(boolean isAllowed, boolean expiresWithin24h, String status, Subscription subscription) {
            this.isAllowed = isAllowed;
            this.expiresWithin24h = expiresWithin24h;
            this.status = status;
            this.subscription = subscription;
        }
    }
}
