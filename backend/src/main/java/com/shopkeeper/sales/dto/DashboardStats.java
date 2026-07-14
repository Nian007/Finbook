package com.shopkeeper.sales.dto;

import java.math.BigDecimal;

public class DashboardStats {
    private Long todaySalesCount;
    private BigDecimal todayRevenue;
    private BigDecimal totalRevenue;
    private Long totalSalesCount;

    public DashboardStats(Long todaySalesCount, BigDecimal todayRevenue, BigDecimal totalRevenue, Long totalSalesCount) {
        this.todaySalesCount = todaySalesCount;
        this.todayRevenue = todayRevenue;
        this.totalRevenue = totalRevenue;
        this.totalSalesCount = totalSalesCount;
    }

    public Long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(Long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public void setTodayRevenue(BigDecimal todayRevenue) {
        this.todayRevenue = todayRevenue;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getTotalSalesCount() {
        return totalSalesCount;
    }

    public void setTotalSalesCount(Long totalSalesCount) {
        this.totalSalesCount = totalSalesCount;
    }
}
