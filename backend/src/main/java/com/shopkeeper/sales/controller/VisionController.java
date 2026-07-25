package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.model.InventoryItem;
import com.shopkeeper.sales.model.ScanSession;
import com.shopkeeper.sales.repository.InventoryRepository;
import com.shopkeeper.sales.repository.ScanSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Base64;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vision")
public class VisionController {

    @Autowired
    private ScanSessionRepository scanSessionRepository;
    
    @Autowired
    private InventoryRepository inventoryRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @PostMapping("/identify")
    @Transactional
    public ResponseEntity<?> identifyProduct(
            @RequestParam("image") MultipartFile image,
            @RequestParam("token") String token) {
            
        ScanSession session = scanSessionRepository.findByToken(token).orElse(null);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Invalid or expired session");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType();
            if (mimeType == null) mimeType = "image/jpeg";

            Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Image);
            Map<String, Object> textPart = Map.of("text", "Identify this product for a small retail store inventory. Return ONLY a JSON object with two fields: 'guess' (the name of the product) and 'category' (e.g. Packaged Food, Electronics, etc.). Do not include markdown formatting or backticks, just raw JSON.");
            Map<String, Object> imagePart = Map.of("inline_data", inlineData);
            Map<String, Object> partContainer = Map.of("parts", List.of(textPart, imagePart));
            Map<String, Object> requestPayload = Map.of("contents", List.of(partContainer));

            ObjectMapper mapper = new ObjectMapper();
            String payload = mapper.writeValueAsString(requestPayload);

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(payload, headers);

            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(geminiUrl, request, String.class);

            JsonNode rootNode = mapper.readTree(response.getBody());
            String textResponse = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            // Clean up possible markdown block from Gemini
            textResponse = textResponse.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode aiJson = mapper.readTree(textResponse);
            String aiGuess = aiJson.path("guess").asText();
            String aiCategory = aiJson.path("category").asText();

            // Search against existing inventory using the AI's guess (first word for broader match)
            String searchPhrase = aiGuess.split(" ")[0]; 
            List<InventoryItem> matchedItems = inventoryRepository.searchByBusinessIdAndName(session.getBusiness().getId(), searchPhrase);

            return ResponseEntity.ok(Map.of(
                "guess", aiGuess,
                "category", aiCategory,
                "matches", matchedItems
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "AI Recognition Failed: " + e.getMessage()));
        }
    }
}
