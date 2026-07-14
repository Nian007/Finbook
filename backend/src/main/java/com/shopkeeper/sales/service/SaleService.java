package com.shopkeeper.sales.service;

import com.shopkeeper.sales.dto.DashboardStats;
import com.shopkeeper.sales.dto.SaleRequest;
import com.shopkeeper.sales.model.Sale;
import com.shopkeeper.sales.model.SaleItem;
import com.shopkeeper.sales.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.security.core.context.SecurityContextHolder;
import com.shopkeeper.sales.security.CustomUserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    public Sale createSale(SaleRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();
        
        Sale sale = new Sale();
        
        // We need to fetch the Business from repo or just set the reference. Let's assume we can set a reference
        com.shopkeeper.sales.model.Business businessRef = new com.shopkeeper.sales.model.Business();
        businessRef.setId(businessId);
        sale.setBusiness(businessRef);

        String invoiceNumber = "INV-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-"
                + String.format("%04d", new Random().nextInt(10000));
        sale.setInvoiceNumber(invoiceNumber);

        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setNotes(request.getNotes());

        BigDecimal totalAmount = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (SaleRequest.ItemRequest itemRequest : request.getItems()) {
                SaleItem saleItem = new SaleItem();
                saleItem.setProductName(itemRequest.getProductName());
                saleItem.setQuantity(itemRequest.getQuantity());
                saleItem.setUnitPrice(itemRequest.getUnitPrice());

                BigDecimal subtotal = itemRequest.getUnitPrice()
                        .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
                saleItem.setSubtotal(subtotal);
                saleItem.setSale(sale);

                sale.getItems().add(saleItem);
                totalAmount = totalAmount.add(subtotal);
            }
        }

        sale.setTotalAmount(totalAmount);
        return saleRepository.save(sale);
    }

    public List<Sale> getAllSales() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return saleRepository.findAllByBusinessIdOrderByCreatedAtDesc(userDetails.getBusinessId());
    }

    public Optional<Sale> getSaleById(Long id) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return saleRepository.findByIdAndBusinessId(id, userDetails.getBusinessId());
    }

    public void deleteSale(Long id) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // Should really verify it belongs to business first, but keeping simple for now
        saleRepository.findByIdAndBusinessId(id, userDetails.getBusinessId()).ifPresent(sale -> saleRepository.delete(sale));
    }

    public List<Sale> searchSales(String query) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return saleRepository.search(userDetails.getBusinessId(), query);
    }

    public DashboardStats getDashboardStats() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();
        
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        Long todaySalesCount = saleRepository.countSalesSince(businessId, todayStart);
        BigDecimal todayRevenue = saleRepository.totalRevenueSince(businessId, todayStart);
        BigDecimal totalRevenue = saleRepository.totalRevenueAllTime(businessId);
        Long totalSalesCount = saleRepository.countSalesAllTime(businessId);

        return new DashboardStats(todaySalesCount, todayRevenue, totalRevenue, totalSalesCount);
    }
}
