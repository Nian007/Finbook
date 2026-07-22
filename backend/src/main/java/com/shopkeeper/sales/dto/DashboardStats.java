package com.shopkeeper.sales.dto;

import java.math.BigDecimal;

public class DashboardStats {
    private Long todaySalesCount;
    private BigDecimal todayRevenue;
    private BigDecimal totalRevenue;
    private Long totalSalesCount;
    private BigDecimal todayGrossProfit;
    private BigDecimal totalGrossProfit;

    public DashboardStats(Long todaySalesCount, BigDecimal todayRevenue, BigDecimal totalRevenue, Long totalSalesCount, BigDecimal todayGrossProfit, BigDecimal totalGrossProfit) {
        this.todaySalesCount = todaySalesCount;
        this.todayRevenue = todayRevenue;
        this.totalRevenue = totalRevenue;
        this.totalSalesCount = totalSalesCount;
        this.todayGrossProfit = todayGrossProfit;
        this.totalGrossProfit = totalGrossProfit;
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

    public Long getTotalSalesCount() { return totalSalesCount; }
    public void setTotalSalesCount(Long totalSalesCount) { this.totalSalesCount = totalSalesCount; }
    public BigDecimal getTodayGrossProfit() { return todayGrossProfit; }
    public void setTodayGrossProfit(BigDecimal todayGrossProfit) { this.todayGrossProfit = todayGrossProfit; }
    public BigDecimal getTotalGrossProfit() { return totalGrossProfit; }
    public void setTotalGrossProfit(BigDecimal totalGrossProfit) { this.totalGrossProfit = totalGrossProfit; }
}
