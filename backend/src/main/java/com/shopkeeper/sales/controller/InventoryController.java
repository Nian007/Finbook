package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.security.CustomUserDetails;
import com.shopkeeper.sales.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("")
    public ResponseEntity<List<Map<String, Object>>> getAllItems() {
        Long businessId = getCurrentUser().getBusinessId();
        List<Map<String, Object>> items = inventoryService.getAllItems(businessId)
            .stream().map(inventoryService::toDto).toList();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchItems(@RequestParam String q) {
        Long businessId = getCurrentUser().getBusinessId();
        List<Map<String, Object>> items = inventoryService.searchItems(businessId, q)
            .stream().map(inventoryService::toDto).toList();
        return ResponseEntity.ok(items);
    }

    @PostMapping("")
    public ResponseEntity<?> addItem(@RequestBody Map<String, Object> body) {
        try {
            Long businessId = getCurrentUser().getBusinessId();
            InventoryItem item = inventoryService.addItem(businessId, body);
            return ResponseEntity.status(201).body(inventoryService.toDto(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long businessId = getCurrentUser().getBusinessId();
            InventoryItem item = inventoryService.updateItem(businessId, id, body);
            return ResponseEntity.ok(inventoryService.toDto(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        try {
            Long businessId = getCurrentUser().getBusinessId();
            inventoryService.deleteItem(businessId, id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private CustomUserDetails getCurrentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
