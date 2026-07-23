package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.model.Business;
import com.shopkeeper.sales.model.ScanSession;
import com.shopkeeper.sales.repository.BusinessRepository;
import com.shopkeeper.sales.repository.ScanSessionRepository;
import com.shopkeeper.sales.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/scan-sessions")
public class ScanSessionController {

    @Autowired
    private ScanSessionRepository scanSessionRepository;
    
    @Autowired
    private BusinessRepository businessRepository;

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    @PostMapping
    public ResponseEntity<Map<String, String>> createSession() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Business business = businessRepository.findById(userDetails.getBusinessId()).orElseThrow();

        ScanSession session = new ScanSession();
        session.setToken(UUID.randomUUID().toString());
        session.setBusiness(business);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        scanSessionRepository.save(session);

        return ResponseEntity.ok(Map.of("token", session.getToken()));
    }

    @GetMapping(value = "/{token}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String token) {
        scanSessionRepository.findByToken(token).orElseThrow();
        
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes timeout
        emitters.put(token, emitter);

        emitter.onCompletion(() -> emitters.remove(token));
        emitter.onTimeout(() -> emitters.remove(token));
        emitter.onError((e) -> emitters.remove(token));

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            emitters.remove(token);
        }

        return emitter;
    }

    @PostMapping("/{token}/pair")
    public ResponseEntity<?> pairMobile(@PathVariable String token) {
        ScanSession session = scanSessionRepository.findByToken(token).orElseThrow();
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Session expired");
        }
        
        session.setStatus("PAIRED");
        scanSessionRepository.save(session);

        sendSseEvent(token, "PAIRED", Map.of("businessName", session.getBusiness().getBusinessName()));
        
        return ResponseEntity.ok(Map.of(
            "status", "PAIRED", 
            "businessName", session.getBusiness().getBusinessName()
        ));
    }

    @PostMapping("/{token}/add-sale")
    public ResponseEntity<?> addSaleItem(@PathVariable String token, @RequestBody Map<String, Object> payload) {
        scanSessionRepository.findByToken(token).orElseThrow();
        sendSseEvent(token, "ADD_SALE", payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{token}/add-inventory")
    public ResponseEntity<?> addInventoryItem(@PathVariable String token, @RequestBody Map<String, Object> payload) {
        scanSessionRepository.findByToken(token).orElseThrow();
        sendSseEvent(token, "ADD_INVENTORY", payload);
        return ResponseEntity.ok().build();
    }

    private void sendSseEvent(String token, String eventName, Object data) {
        SseEmitter emitter = emitters.get(token);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                emitters.remove(token);
            }
        }
    }
}
