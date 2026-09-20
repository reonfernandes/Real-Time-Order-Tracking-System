package com.reon.order_backend.repository;

import com.reon.order_backend.document.FailedEvent;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FailedEventRepository extends MongoRepository<FailedEvent, ObjectId> {
}
