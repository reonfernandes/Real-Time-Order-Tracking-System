package com.reon.order_backend.repository;

import com.reon.order_backend.document.Order;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, ObjectId> {
    Page<Order> findByUserId(ObjectId userId, Pageable pageable);

    Optional<Order> findById(ObjectId id);

    long countByUserId(ObjectId userId);
}
