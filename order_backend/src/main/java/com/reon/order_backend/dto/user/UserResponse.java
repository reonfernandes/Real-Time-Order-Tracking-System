package com.reon.order_backend.dto.user;

import com.reon.order_backend.document.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private ObjectId id;
    private String name;
    private String email;
    private boolean accountEnabled;
    private Set<User.Role> roles;
    private LocalDateTime createdOn;
    private LocalDateTime updatedOn;

    // only the count is sent here, actual orders are served by the order apis
    private int totalOrders;
}
