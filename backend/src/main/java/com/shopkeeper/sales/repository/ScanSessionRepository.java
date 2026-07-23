package com.shopkeeper.sales.repository;

import com.shopkeeper.sales.model.ScanSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface ScanSessionRepository extends JpaRepository<ScanSession, Long> {
    Optional<ScanSession> findByToken(String token);
    void deleteByExpiresAtBefore(LocalDateTime time);
}
