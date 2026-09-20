package com.reon.order_backend.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/*
Keeps a small note of the events we have already handled, so that a kafka retry or a
duplicate delivery does not send the same mail twice.
Id is orderId + status, which is unique for one step of an order.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "processed_events")
public class ProcessedEvent {
    @Id
    private String id;

    // old entries clean up on their own after 30 days, no need to keep them forever
    @Indexed(expireAfter = "30d")
    private LocalDateTime processedAt;
}
