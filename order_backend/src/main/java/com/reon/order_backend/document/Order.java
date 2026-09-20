package com.reon.order_backend.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "orders")
public class Order {
    @Id
    private ObjectId id;
    // indexed because every "my orders" call searches on this field
    @Indexed
    private ObjectId userId;    // which user has placed the order.

    // todo: later create a product document..
    private List<String> items = new ArrayList<>();
    private Double amount;
    private Status status;

    public enum Status {
        PENDING,            // Order placed but payment not yet confirmed
        CONFIRMED,          // Payment received and order confirmed
        PROCESSING,         // Order is being prepared
        PACKED,             // Order is packed
        SHIPPED,            // Order handed over to courier
        OUT_FOR_DELIVERY,   // Courier is delivering the order
        DELIVERED,          // Customer received the order
        CANCELLED,          // Order was cancelled before delivery
        RETURNED            // Customer returned the order
    }

    private Map<String, LocalDateTime> timeStamps = new HashMap<>();

    @CreatedDate
    private LocalDateTime createdOn;
    @LastModifiedDate
    private LocalDateTime updateOn;
}
