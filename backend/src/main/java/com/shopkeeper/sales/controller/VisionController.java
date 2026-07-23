package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.model.ScanSession;
import com.shopkeeper.sales.repository.InventoryItemRepository;
import com.shopkeeper.sales.repository.ScanSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vision")
public class VisionController {

    @Autowired
    private ScanSessionRepository scanSessionRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @PostMapping("/identify")
    public ResponseEntity<?> identifyProduct(
            @RequestParam("image") MultipartFile image,
            @RequestParam("token") String token) {
            
        ScanSession session = scanSessionRepository.findByToken(token).orElse(null);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Invalid or expired session");
        }

        // TODO: Call actual AI Vision API (e.g., Claude 3 Haiku, Google Gemini Pro Vision)
        // byte[] imageBytes = image.getBytes();
        // String aiGuess = myAiService.identify(imageBytes);

        // MOCK AI GUESS
        String aiGuess = "Parle-G Gold Biscuits (100g)";
        String aiCategory = "Packaged Food";

        // MOCK FUZZY SEARCH against existing inventory using the AI's guess
        List<InventoryItem> matchedItems = inventoryItemRepository.search("Parle");

        return ResponseEntity.ok(Map.of(
            "guess", aiGuess,
            "category", aiCategory,
            "matches", matchedItems
        ));
    }
}
