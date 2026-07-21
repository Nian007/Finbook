package com.shopkeeper.sales.service;

import com.shopkeeper.sales.model.Business;
import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.repository.BusinessRepository;
import com.shopkeeper.sales.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private BusinessRepository businessRepository;

    public List<InventoryItem> getAllItems(Long businessId) {
        return inventoryRepository.findByBusinessIdAndIsActiveTrueOrderByNameAsc(businessId);
    }

    public List<InventoryItem> searchItems(Long businessId, String query) {
        if (query == null || query.isBlank()) {
            return inventoryRepository.findByBusinessIdAndIsActiveTrueOrderByNameAsc(businessId);
        }
        return inventoryRepository.searchByBusinessIdAndName(businessId, query.trim());
    }

    public InventoryItem addItem(Long businessId, Map<String, Object> request) {
        Business business = businessRepository.findById(businessId)
            .orElseThrow(() -> new RuntimeException("Business not found"));

        InventoryItem item = new InventoryItem();
        item.setBusiness(business);
        item.setName(getString(request, "name"));
        item.setSku(getString(request, "sku"));
        item.setDescription(getString(request, "description"));
        item.setUnit(getString(request, "unit"));
        item.setQuantityOnHand(getInt(request, "quantityOnHand"));

        // Accept price as rupees from frontend, store as paise
        Double priceRs = getDouble(request, "price");
        if (priceRs != null) {
            item.setPriceInPaise(Math.round(priceRs * 100));
        }

        return inventoryRepository.save(item);
    }

    public InventoryItem updateItem(Long businessId, Long itemId, Map<String, Object> request) {
        InventoryItem item = inventoryRepository.findByIdAndBusinessId(itemId, businessId)
            .orElseThrow(() -> new RuntimeException("Item not found or access denied"));

        if (request.containsKey("name")) item.setName(getString(request, "name"));
        if (request.containsKey("sku")) item.setSku(getString(request, "sku"));
        if (request.containsKey("description")) item.setDescription(getString(request, "description"));
        if (request.containsKey("unit")) item.setUnit(getString(request, "unit"));
        if (request.containsKey("quantityOnHand")) item.setQuantityOnHand(getInt(request, "quantityOnHand"));
        if (request.containsKey("price")) {
            Double priceRs = getDouble(request, "price");
            if (priceRs != null) item.setPriceInPaise(Math.round(priceRs * 100));
        }

        return inventoryRepository.save(item);
    }

    public void deleteItem(Long businessId, Long itemId) {
        InventoryItem item = inventoryRepository.findByIdAndBusinessId(itemId, businessId)
            .orElseThrow(() -> new RuntimeException("Item not found or access denied"));
        item.setIsActive(false);
        inventoryRepository.save(item);
    }

    // Helper to map InventoryItem → frontend-friendly format (price as rupees)
    public Map<String, Object> toDto(InventoryItem item) {
        return Map.of(
            "id", item.getId(),
            "name", item.getName() != null ? item.getName() : "",
            "sku", item.getSku() != null ? item.getSku() : "",
            "description", item.getDescription() != null ? item.getDescription() : "",
            "unit", item.getUnit() != null ? item.getUnit() : "pcs",
            "price", item.getPriceInPaise() != null ? item.getPriceInPaise() / 100.0 : 0.0,
            "quantityOnHand", item.getQuantityOnHand() != null ? item.getQuantityOnHand() : 0,
            "createdAt", item.getCreatedAt()
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private String getString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Integer getInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        if (v instanceof String) {
            try { return Integer.parseInt((String) v); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private Double getDouble(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number) return ((Number) v).doubleValue();
        if (v instanceof String) {
            try { return Double.parseDouble((String) v); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
