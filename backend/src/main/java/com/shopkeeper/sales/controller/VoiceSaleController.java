package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.dto.VoiceParseRequest;
import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.repository.InventoryRepository;
import com.shopkeeper.sales.repository.SaleRepository;
import com.shopkeeper.sales.security.CustomUserDetails;
import com.shopkeeper.sales.service.AiVoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sales")
public class VoiceSaleController {

    @Autowired
    private AiVoiceService aiVoiceService;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @PostMapping("/voice-parse")
    public ResponseEntity<?> parseVoiceSale(@RequestBody VoiceParseRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long businessId = userDetails.getBusinessId();

        try {
            // Extract unique customers from past sales
            List<String> distinctCustomers = saleRepository.findDistinctCustomerNamesByBusinessId(businessId);
            
            // Map strings to Customer List JSON structure
            List<Map<String, Object>> customerList = distinctCustomers.stream()
                .map(name -> Map.<String, Object>of("id", name, "name", name))
                .collect(Collectors.toList());

            // Extract products from actual active inventory
            List<InventoryItem> activeInventory = inventoryRepository.findByBusinessIdAndIsActiveTrueOrderByNameAsc(businessId);
            
            // Map products to Product List JSON structure for the AI
            List<Map<String, Object>> productList = activeInventory.stream()
                .map(p -> Map.<String, Object>of(
                    "id", p.getId(),
                    "name", p.getName(),
                    "unit", p.getUnit() != null ? p.getUnit() : "pcs",
                    "price", p.getPriceInPaise() != null ? p.getPriceInPaise() / 100.0 : 0.0
                ))
                .collect(Collectors.toList());

            // Parse with Gemini
            Map<String, Object> jsonResult = aiVoiceService.parseSaleTranscript(request.getTranscript(), customerList, productList);

            return ResponseEntity.ok(jsonResult);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Voice parsing failed: " + e.getMessage()));
        }
    }
}
