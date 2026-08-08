package com.shopkeeper.sales.service;

import com.shopkeeper.sales.dto.DashboardStats;
import com.shopkeeper.sales.dto.SaleRequest;
import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.model.Sale;
import com.shopkeeper.sales.model.SaleItem;
import com.shopkeeper.sales.repository.InventoryRepository;
import com.shopkeeper.sales.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Autowired
    private InventoryRepository inventoryRepository;

    @Transactional
    public Sale createSale(SaleRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();
        
        Sale sale = new Sale();
        
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
                
                // Inventory Logic
                if (itemRequest.getProductId() != null) {
                    Optional<InventoryItem> invOpt = inventoryRepository.findByIdAndBusinessId(itemRequest.getProductId(), businessId);
                    if (invOpt.isPresent()) {
                        InventoryItem inv = invOpt.get();
                        saleItem.setProductId(inv.getId());
                        
                        if (inv.getCostPriceInPaise() != null) {
                            saleItem.setCostPrice(BigDecimal.valueOf(inv.getCostPriceInPaise()).divide(BigDecimal.valueOf(100)));
                        } else {
                            saleItem.setCostPrice(BigDecimal.ZERO);
                        }
                        
                        if (inv.getQuantityOnHand() != null) {
                            inv.setQuantityOnHand(inv.getQuantityOnHand() - itemRequest.getQuantity());
                            inventoryRepository.save(inv);
                        }
                    } else {
                        saleItem.setCostPrice(BigDecimal.ZERO);
                    }
                } else {
                    saleItem.setCostPrice(BigDecimal.ZERO);
                }

                saleItem.setSale(sale);
                sale.getItems().add(saleItem);
                totalAmount = totalAmount.add(subtotal);
            }
        }

        sale.setTotalAmount(totalAmount);
        
        BigDecimal amountPaid = request.getAmountPaid() != null ? request.getAmountPaid() : totalAmount;
        sale.setAmountPaid(amountPaid);
        
        if (amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            sale.setPaymentStatus("UNPAID");
        } else if (amountPaid.compareTo(totalAmount) < 0) {
            sale.setPaymentStatus("PARTIAL");
        } else {
            sale.setPaymentStatus("PAID");
        }
        
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
        saleRepository.findByIdAndBusinessId(id, userDetails.getBusinessId()).ifPresent(sale -> saleRepository.delete(sale));
    }

    public List<Sale> searchSales(String query) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return saleRepository.search(userDetails.getBusinessId(), query);
    }

    public List<Sale> getOutstandingSales() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return saleRepository.findAllByBusinessIdAndPaymentStatusNotOrderByCreatedAtDesc(userDetails.getBusinessId(), "PAID");
    }

    @Transactional
    public Sale recordPayment(Long id, BigDecimal paymentAmount) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Sale sale = saleRepository.findByIdAndBusinessId(id, userDetails.getBusinessId())
                .orElseThrow(() -> new RuntimeException("Sale not found"));
        
        BigDecimal newAmountPaid = sale.getAmountPaid().add(paymentAmount);
        if (newAmountPaid.compareTo(sale.getTotalAmount()) > 0) {
            newAmountPaid = sale.getTotalAmount(); // cap at total
        }
        sale.setAmountPaid(newAmountPaid);
        
        if (newAmountPaid.compareTo(sale.getTotalAmount()) >= 0) {
            sale.setPaymentStatus("PAID");
        } else if (newAmountPaid.compareTo(BigDecimal.ZERO) > 0) {
            sale.setPaymentStatus("PARTIAL");
        } else {
            sale.setPaymentStatus("UNPAID");
        }
        
        return saleRepository.save(sale);
    }

    public DashboardStats getDashboardStats(String startDate, String endDate) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();
        
        LocalDateTime start;
        LocalDateTime end;

        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            start = LocalDate.parse(startDate).atStartOfDay();
            end = LocalDate.parse(endDate).atTime(23, 59, 59);
        } else {
            start = LocalDate.now().atStartOfDay();
            end = LocalDate.now().atTime(23, 59, 59);
        }
        
        Long todaySalesCount = saleRepository.countSalesBetween(businessId, start, end);
        BigDecimal todayRevenue = saleRepository.totalRevenueBetween(businessId, start, end);
        BigDecimal totalRevenue = saleRepository.totalRevenueAllTime(businessId);
        Long totalSalesCount = saleRepository.countSalesAllTime(businessId);
        BigDecimal todayGrossProfit = saleRepository.totalGrossProfitBetween(businessId, start, end);
        BigDecimal totalGrossProfit = saleRepository.totalGrossProfitAllTime(businessId);

        return new DashboardStats(todaySalesCount, todayRevenue, totalRevenue, totalSalesCount, todayGrossProfit, totalGrossProfit);
    }
}
