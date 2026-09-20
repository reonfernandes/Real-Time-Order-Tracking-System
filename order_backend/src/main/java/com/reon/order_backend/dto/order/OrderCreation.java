package com.reon.order_backend.dto.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreation {
    @NotEmpty(message = "Order must contain at least one item")
    private List<String> items;

    // DecimalMin alone lets null pass, and a null amount later blows up in the consumer
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount should be non-negative")
    private Double amount;
}
