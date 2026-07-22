package com.shopkeeper.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiVoiceService {

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> parseSaleTranscript(String transcript, List<Map<String, Object>> customers, List<Map<String, Object>> products) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey.trim();

        String systemInstruction = """
You are a data-extraction engine embedded inside a small-business billing app used in India. A shopkeeper taps a mic button in the app and speaks a sale entry in Hindi, Hinglish, or a regional language. The audio has already been transcribed to text by a speech-to-text engine (transcription may contain errors, especially with numbers and proper names).

Your job: convert the transcript into a structured JSON sale record, matched against the shop's existing product and customer database wherever possible.

## Output: ONLY valid JSON, no markdown, no preamble, no explanation. Schema:

{
  "customer": {
    "matched_id": <id or null>,
    "matched_name": <string or null>,
    "raw_spoken_name": <string>,
    "is_new": <true if no reasonable match exists in CUSTOMER_LIST>,
    "confidence": "high" | "medium" | "low"
  },
  "items": [
    {
      "matched_product_id": <id or null>,
      "matched_product_name": <string or null>,
      "raw_spoken_item": <string>,
      "is_new": <true if no reasonable match exists in PRODUCT_LIST>,
      "quantity": <number>,
      "unit": <string>,
      "unit_price_used": <number or null, from PRODUCT_LIST if matched>,
      "line_total": <number or null>,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "payment": {
    "amount_paid": <number or null>,
    "computed_total": <sum of line_totals, or null if items unmatched>,
    "payment_status": "full" | "partial" | "unpaid" | "unclear"
  },
  "notes": <string, English, explain anything ambiguous or assumptions made>,
  "overall_confidence": "high" | "medium" | "low",
  "needs_review": <true if any field has confidence "low", any is_new is true, or price is 0>
}

## Extraction rules:

1. Convert spoken Hindi numbers (ek, do, teen, chaar, paanch, das, sau, hazaar, dedh, ढाई etc.) to numerals.
2. Common payment phrases: "diya/diye/de diya" = paid this amount. "aadha diya" = partial, roughly 50%. "udhaar" / "baad mein dega" = unpaid, full amount is due.
3. If quantity is not stated, default to 1.
4. If multiple items are mentioned in one sentence (e.g. 2 chips, 4 soap, 1 ajwain), MUST split into separate distinct entries in the "items" array.
5. Match spoken item/customer names to the CLOSEST entry in the provided lists, even with imperfect phonetic overlap.
6. Trust the shopkeeper implicitly. If they say an item costs a certain amount, or pay a certain amount, that is absolute truth. DO NOT add notes questioning the price.
7. If no reasonable match exists in the database, set matched_id to null, is_new to true, and preserve the raw spoken text.
8. If the price is missing and not found in the DB, leave it as 0 and set needs_review to true.
9. Never guess a customer or product into existence with a fabricated ID. Ambiguity is always surfaced via is_new / low confidence / needs_review.
""";

        String userPrompt = String.format("TRANSCRIPT: %s\n\nPRODUCT_LIST: %s\n\nCUSTOMER_LIST: %s", 
                transcript, 
                objectMapper.writeValueAsString(products), 
                objectMapper.writeValueAsString(customers));

        Map<String, Object> requestBody = Map.of(
            "system_instruction", Map.of("parts", Map.of("text", systemInstruction)),
            "contents", List.of(Map.of("parts", List.of(Map.of("text", userPrompt)))),
            "generationConfig", Map.of("responseMimeType", "application/json")
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

        String responseStr = restTemplate.postForObject(url, request, String.class);

        // Parse Gemini Response
        Map<String, Object> root = objectMapper.readValue(responseStr, Map.class);
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) root.get("candidates");
        if (candidates != null && !candidates.isEmpty()) {
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts != null && !parts.isEmpty()) {
                String jsonResult = (String) parts.get(0).get("text");
                jsonResult = jsonResult.replaceAll("(?s)^```json\\s*", "").replaceAll("(?s)```\\s*$", "");
                return objectMapper.readValue(jsonResult, Map.class);
            }
        }
        
        throw new RuntimeException("Failed to extract JSON from Gemini response");
    }
}
