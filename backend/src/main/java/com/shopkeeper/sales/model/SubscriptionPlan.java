package com.shopkeeper.sales.model;

import jakarta.persistence.*;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Monthly, Quarterly, Half-yearly, Yearly

    @Column(nullable = false)
    private Long priceInPaise; // e.g. 75000 = ₹750

    @Column(nullable = false)
    private Integer durationDays; // 30, 90, 180, 365

    private String description; // Shown on plan card

    @Column(nullable = false)
    private Integer displayOrder; // Sort order for plan cards

    @Column(nullable = false)
    private Boolean isActive = true;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getPriceInPaise() { return priceInPaise; }
    public void setPriceInPaise(Long priceInPaise) { this.priceInPaise = priceInPaise; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
