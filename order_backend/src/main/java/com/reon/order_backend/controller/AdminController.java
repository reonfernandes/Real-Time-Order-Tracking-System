package com.reon.order_backend.controller;

import com.reon.order_backend.dto.user.UserResponse;
import com.reon.order_backend.service.AdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import lombok.extern.slf4j.Slf4j;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


@RestController
@Validated
@RequestMapping(
        name = "endpoints only accessible for user with admin role",
        path = "/api/v1/admin"
)
@Slf4j
@Tag(
        name = "Admin APIs",
        description = "These endpoints are only accessible to user with ADMIN role after successful authentication."
)
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(
            name = "endpoint to fetch all users",
            path = "/users"
    )
    @Operation(
            summary = "Fetch all users (paginated)",
            description = "Allows admin to fetch paginated list of users"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users fetched successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<UserResponse>> fetchUsers(
            @RequestParam(name = "page", defaultValue = "0")
            @Min(value = 0, message = "Page cannot be negative") int pageNo,
            @RequestParam(name = "size", defaultValue = "10")
            @Min(value = 1, message = "Size must be at least 1")
            @Max(value = 100, message = "Size cannot be more than 100") int pageSize
    ) {
        log.info("Admin Controller :: Fetch all users → page = {}, size = {}", pageNo, pageSize);
        Page<UserResponse> users = adminService.fetchAllUsers(pageNo, pageSize);
        return ResponseEntity.status(HttpStatus.OK).body(users);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(
            name = "endpoint to fetch user via id",
            path = "/id/{id}"
    )
    @Operation(
            summary = "Fetch user by ID",
            description = "Allows admin to fetch a user using ObjectId"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User fetched successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class)))
    })
    public ResponseEntity<UserResponse> fetchUserViaId(@PathVariable(name = "id") ObjectId id) {
        log.info("Admin Controller :: Fetch user by ID: {}", id);
        UserResponse user = adminService.fetchById(id);
        return ResponseEntity.status(HttpStatus.OK).body(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(
            name = "endpoint to fetch user via emailId",
            path = "/email/{email}"
    )
    @Operation(
            summary = "Fetch user by Email",
            description = "Allows admin to fetch a user using their email address"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User fetched successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class)))
    })
    public ResponseEntity<UserResponse> fetchUserViaEmail(@PathVariable(name = "email") String email) {
        log.info("Admin Controller :: Fetch user by Email: {}", email);
        UserResponse user = adminService.fetchByEmail(email);
        return ResponseEntity.status(HttpStatus.OK).body(user);
    }
}
