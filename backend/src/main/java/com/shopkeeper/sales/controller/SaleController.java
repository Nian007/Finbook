package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.dto.DashboardStats;
import com.shopkeeper.sales.dto.SaleRequest;
import com.shopkeeper.sales.model.Sale;
import com.shopkeeper.sales.service.SaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @PostMapping
    public ResponseEntity<Sale> createSale(@RequestBody SaleRequest request) {
        Sale sale = saleService.createSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {
        return ResponseEntity.ok(saleService.getAllSales());
    }

    @GetMapping("/outstanding")
    public ResponseEntity<List<Sale>> getOutstandingSales() {
        return ResponseEntity.ok(saleService.getOutstandingSales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSaleById(@PathVariable Long id) {
        return saleService.getSaleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSale(@PathVariable Long id) {
        saleService.deleteSale(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Sale>> searchSales(@RequestParam String query) {
        return ResponseEntity.ok(saleService.searchSales(query));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Sale> recordPayment(@PathVariable Long id, @RequestBody java.util.Map<String, java.math.BigDecimal> payload) {
        java.math.BigDecimal amount = payload.get("amount");
        return ResponseEntity.ok(saleService.recordPayment(id, amount));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getDashboardStats(@RequestParam(required = false) Integer days) {
        return ResponseEntity.ok(saleService.getDashboardStats(days));
    }
}
