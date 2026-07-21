package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.model.Subscription;
import com.shopkeeper.sales.model.SubscriptionAuditLog;
import com.shopkeeper.sales.model.SubscriptionPlan;
import com.shopkeeper.sales.security.CustomUserDetails;
import com.shopkeeper.sales.service.SubscriptionService;
import com.shopkeeper.sales.service.SubscriptionService.SubscriptionStatusResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    // ─── Public: Plan listing ─────────────────────────────────────────────────────

    @GetMapping("/api/subscriptions/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getActivePlans());
    }

    // ─── User: Check own subscription status ─────────────────────────────────────

    @GetMapping("/api/subscriptions/status")
    public ResponseEntity<?> getStatus() {
        Long businessId = getCurrentUser().getBusinessId();
        SubscriptionStatusResult result = subscriptionService.checkSubscriptionStatus(businessId);

        Map<String, Object> response = new HashMap<>();
        response.put("isAllowed", result.isAllowed);
        response.put("expiresWithin24h", result.expiresWithin24h);
        response.put("status", result.status);
        if (result.subscription != null) {
            response.put("endDate", result.subscription.getEndDate());
            response.put("planName", result.subscription.getPlan() != null ?
                result.subscription.getPlan().getName() : "Free Trial");
            response.put("subscriptionId", result.subscription.getId());
            response.put("utrNumber", result.subscription.getUtrNumber());
        }
        return ResponseEntity.ok(response);
    }

    // ─── User: Start payment flow ─────────────────────────────────────────────────

    @PostMapping("/api/subscriptions/initiate")
    public ResponseEntity<?> initiate(@RequestBody Map<String, Object> body) {
        try {
            Long businessId = getCurrentUser().getBusinessId();
            Long planId = Long.parseLong(body.get("planId").toString());
            Subscription sub = subscriptionService.initiatePendingSubscription(businessId, planId);

            Map<String, Object> response = new HashMap<>();
            response.put("subscriptionId", sub.getId());
            response.put("status", sub.getStatus().name());
            response.put("upiId", SubscriptionService.UPI_ID);
            response.put("upiName", SubscriptionService.UPI_NAME);
            response.put("planName", sub.getPlan().getName());
            response.put("amount", sub.getPlan().getPriceInPaise() / 100.0);
            response.put("message", "Please pay ₹" + (sub.getPlan().getPriceInPaise() / 100) +
                " to UPI ID " + SubscriptionService.UPI_ID + " and submit your UTR number below.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── User: Submit UTR after payment ──────────────────────────────────────────

    @PostMapping("/api/subscriptions/{id}/utr")
    public ResponseEntity<?> submitUtr(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long businessId = getCurrentUser().getBusinessId();
            String utr = body.get("utrNumber").toString();
            Subscription sub = subscriptionService.submitUTR(id, utr, businessId);
            return ResponseEntity.ok(Map.of(
                "message", "UTR submitted. Your subscription will be activated after admin verification.",
                "utrNumber", sub.getUtrNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Admin: List pending verifications ───────────────────────────────────────

    @GetMapping("/api/admin/subscriptions/pending")
    public ResponseEntity<?> getPending() {
        if (!isSuperAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        List<Subscription> subs = subscriptionService.getPendingVerifications();
        return ResponseEntity.ok(subs.stream().map(this::toAdminDto).toList());
    }

    // ─── Admin: Activate a subscription ──────────────────────────────────────────

    @PostMapping("/api/admin/subscriptions/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        if (!isSuperAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        try {
            Long adminUserId = getCurrentUser().getId();
            Subscription sub = subscriptionService.adminActivateSubscription(id, adminUserId);
            return ResponseEntity.ok(Map.of(
                "message", "Subscription activated successfully.",
                "endDate", sub.getEndDate()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Admin: Grant free trial ──────────────────────────────────────────────────

    @PostMapping("/api/admin/subscriptions/grant-trial")
    public ResponseEntity<?> grantTrial(@RequestBody Map<String, Object> body) {
        if (!isSuperAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        try {
            Long businessId = Long.parseLong(body.get("businessId").toString());
            int days = Integer.parseInt(body.getOrDefault("durationDays", 30).toString());
            String note = body.getOrDefault("note", "").toString();
            Long adminUserId = getCurrentUser().getId();
            Subscription sub = subscriptionService.grantFreeTrial(businessId, days, adminUserId, note);
            return ResponseEntity.ok(Map.of(
                "message", days + "-day free trial granted.",
                "endDate", sub.getEndDate()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Admin: Audit log ────────────────────────────────────────────────────────

    @GetMapping("/api/admin/subscriptions/audit-log")
    public ResponseEntity<?> getAuditLog() {
        if (!isSuperAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        List<SubscriptionAuditLog> logs = subscriptionService.getAuditLog();
        return ResponseEntity.ok(logs);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private CustomUserDetails getCurrentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private boolean isSuperAdmin() {
        CustomUserDetails user = getCurrentUser();
        return user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_super_admin"));
    }

    private Map<String, Object> toAdminDto(Subscription sub) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", sub.getId());
        m.put("businessName", sub.getBusiness().getBusinessName());
        m.put("businessPhone", sub.getBusiness().getPhone());
        m.put("businessId", sub.getBusiness().getId());
        m.put("planName", sub.getPlan() != null ? sub.getPlan().getName() : "—");
        m.put("amount", sub.getPlan() != null ? sub.getPlan().getPriceInPaise() / 100.0 : 0);
        m.put("utrNumber", sub.getUtrNumber());
        m.put("createdAt", sub.getCreatedAt());
        m.put("status", sub.getStatus().name());
        return m;
    }
}
