package com.reon.order_backend.repository;

import com.reon.order_backend.document.RevokedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RevokedTokenRepository extends MongoRepository<RevokedToken, String> {
}
