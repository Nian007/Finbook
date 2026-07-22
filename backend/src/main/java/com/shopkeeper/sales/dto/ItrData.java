package com.shopkeeper.sales.dto;

import java.math.BigDecimal;
import com.shopkeeper.sales.model.Business;

public class ItrData {
    private Business business;
    private BigDecimal cashTurnover;
    private BigDecimal digitalTurnover;

    public ItrData(Business business, BigDecimal cashTurnover, BigDecimal digitalTurnover) {
        this.business = business;
        this.cashTurnover = cashTurnover;
        this.digitalTurnover = digitalTurnover;
    }

    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    public BigDecimal getCashTurnover() { return cashTurnover; }
    public void setCashTurnover(BigDecimal cashTurnover) { this.cashTurnover = cashTurnover; }

    public BigDecimal getDigitalTurnover() { return digitalTurnover; }
    public void setDigitalTurnover(BigDecimal digitalTurnover) { this.digitalTurnover = digitalTurnover; }
}
