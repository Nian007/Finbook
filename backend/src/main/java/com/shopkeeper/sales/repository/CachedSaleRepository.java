package com.shopkeeper.sales.repository;

import com.redis.om.spring.repository.RedisDocumentRepository;
import com.shopkeeper.sales.model.CachedSale;
import org.springframework.stereotype.Repository;

@Repository
public interface CachedSaleRepository extends RedisDocumentRepository<CachedSale, String> {
}
