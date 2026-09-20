package com.reon.order_backend.controller;

import com.reon.order_backend.document.User;
import com.reon.order_backend.dto.order.OrderCreation;
import com.reon.order_backend.dto.order.OrderResponse;
import com.reon.order_backend.dto.order.OrderUpdateStatus;
import com.reon.order_backend.exception.UserNotFoundException;
import com.reon.order_backend.repository.UserRepository;
import com.reon.order_backend.service.OrderService;
import com.reon.order_backend.stream.OrderStreamService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.extern.slf4j.Slf4j;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.security.Principal;

@RestController
@Validated
@RequestMapping(
        name = "endpoint related to orders, accessible after authentication",
        path = "/api/v1/order"
)
@Slf4j
@Tag(
        name = "Order APIs",
        description = "These endpoints are related to placing, tracking and managing orders. Only accessible after authentication."
)
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final OrderStreamService orderStreamService;

    public OrderController(OrderService orderService, UserRepository userRepository,
                           OrderStreamService orderStreamService) {
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.orderStreamService = orderStreamService;
    }

    // admin also holds an account, so they should be able to use their own orders
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping(path = "/generateOrder")
    @Operation(
            summary = "Generate a new Order",
            description = "Creates and saves a new order against the logged-in user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order created successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class)))
    })
    public ResponseEntity<OrderResponse> generateOrder(@Valid @RequestBody OrderCreation createOrder,
                                                       Principal principal) {

        log.info("OrderController :: Request to generate order: {}", createOrder);

        User user = loggedInUser(principal);

        OrderResponse response = orderService.createOrder(createOrder, user.getId());

        log.info("OrderController :: Order successfully created for userId: {}", user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(path = "/orders")
    @Operation(
            summary = "Fetch user's orders",
            description = "Returns paginated list of logged-in user's orders."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders fetched successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<OrderResponse>> fetchOrders(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page cannot be negative") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1")
            @Max(value = 100, message = "Size cannot be more than 100") int size,
            Principal principal) {

        log.info("OrderController :: Fetching orders page: {}, size: {}", page, size);

        User user = loggedInUser(principal);

        Page<OrderResponse> orders = orderService.fetchAllOrders(page, size, user);
        return ResponseEntity.ok(orders);
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(path = "/fetch/{orderId}")
    @Operation(
            summary = "Fetch specific order details",
            description = "Fetch details of a particular order using orderId."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order fetched successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class)))
    })
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable ObjectId orderId,
                                                      Principal principal) {

        log.info("OrderController :: Fetching order id: {}", orderId);

        User user = loggedInUser(principal);

        OrderResponse fetchedOrder = orderService.fetchOrderViaId(orderId, user);
        return ResponseEntity.ok(fetchedOrder);
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping(path = "/cancel/{orderId}")
    @Operation(
            summary = "Cancel an order",
            description = "Cancels the specified order if cancellation is allowed."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Order cancelled successfully")
    })
    public ResponseEntity<Void> cancelOrder(@PathVariable ObjectId orderId, Principal principal) {

        log.info("OrderController :: Cancel order request id: {}", orderId);

        User user = loggedInUser(principal);

        orderService.cancelOrder(orderId, user);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PutMapping(path = "/update/{orderId}")
    @Operation(
            summary = "Update order status",
            description = "Updates an order's status using given orderId."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order status updated successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class)))
    })
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable ObjectId orderId,
                                                           @Valid @RequestBody OrderUpdateStatus request,
                                                           Principal principal) {

        log.info("OrderController :: Update order status request id: {}", orderId);

        User user = loggedInUser(principal);

        OrderResponse updatedOrder = orderService.updateOrder(orderId, request, user);
        return ResponseEntity.ok(updatedOrder);
    }
    /*
    Keeps a connection open and pushes the order every time its status changes, so the
    tracking screen does not have to keep asking. fetchOrderViaId is called first, it
    throws when the order is not there or belongs to somebody else, which keeps this
    endpoint as guarded as the normal fetch.
     */
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping(path = "/stream/{orderId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(
            summary = "Live status of an order",
            description = "Server sent events, one event every time the status of this order changes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stream opened, current status is sent first")
    })
    public SseEmitter streamOrder(@PathVariable ObjectId orderId, Principal principal) {

        log.info("OrderController :: Client subscribed to order: {}", orderId);

        User user = loggedInUser(principal);
        OrderResponse order = orderService.fetchOrderViaId(orderId, user);

        return orderStreamService.subscribe(orderId.toHexString(), order);
    }

    // same lookup was repeated in every method, keeping it at one place now
    private User loggedInUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found."));
    }
}
