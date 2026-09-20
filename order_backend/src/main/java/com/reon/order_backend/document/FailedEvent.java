package com.reon.order_backend.document;

import com.reon.order_backend.dto.kafka.OrderEventDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "failed_events")
public class FailedEvent {
    @Id
    private ObjectId id;
    private String topic;
    private OrderEventDTO payload;
    private String errorMessage;
    private LocalDateTime failedAt;
}
