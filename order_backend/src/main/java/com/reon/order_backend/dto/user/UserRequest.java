package com.reon.order_backend.dto.user;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRequest {
    @NotBlank(message = "Name is required")
    @Pattern(
            regexp = "^[A-Za-z' ]+$",
            message = "Please provide valid name. [numbers and symbols not allowed]"
    )
    private String name;

    @NotBlank(message = "Mention your email id.")
    @Email(
            regexp = "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,3}",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Please provide a valid email address."
    )
    private String email;

    @NotBlank(message = "Password is necessary.")
    @ToString.Exclude          // else the password lands in the logs
    @Size(
            min = 8,
            max = 16,
            message = "Password must be in range of 8 to 16 characters."
    )
    private String password;
}
