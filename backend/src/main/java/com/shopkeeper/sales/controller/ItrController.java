package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.dto.ItrData;
import com.shopkeeper.sales.model.Business;
import com.shopkeeper.sales.repository.BusinessRepository;
import com.shopkeeper.sales.repository.SaleRepository;
import com.shopkeeper.sales.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/itr")
public class ItrController {

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private SaleRepository saleRepository;

    @GetMapping("/data")
    public ResponseEntity<ItrData> getItrData(@RequestParam(defaultValue = "2025") int financialYearStart) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();

        Business business = businessRepository.findById(businessId).orElseThrow();

        LocalDateTime start = LocalDateTime.of(financialYearStart, 4, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(financialYearStart + 1, 3, 31, 23, 59, 59);

        BigDecimal cashTurnover = saleRepository.totalCashRevenueBetween(businessId, start, end);
        BigDecimal digitalTurnover = saleRepository.totalDigitalRevenueBetween(businessId, start, end);

        ItrData data = new ItrData(business, cashTurnover, digitalTurnover);
        return ResponseEntity.ok(data);
    }
}
