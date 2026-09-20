package com.reon.order_backend.service.impl;

import com.reon.order_backend.document.Order;
import com.reon.order_backend.document.User;
import com.reon.order_backend.dto.kafka.OrderEventDTO;
import com.reon.order_backend.dto.order.OrderCreation;
import com.reon.order_backend.dto.order.OrderResponse;
import com.reon.order_backend.dto.order.OrderUpdateStatus;
import com.reon.order_backend.exception.OrderNotCancellableException;
import com.reon.order_backend.exception.OrderNotFoundException;
import com.reon.order_backend.exception.UserNotFoundException;
import com.reon.order_backend.mapper.OrderMapper;
import com.reon.order_backend.repository.OrderRepository;
import com.reon.order_backend.repository.UserRepository;
import com.reon.order_backend.service.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderServiceImpl(OrderRepository orderRepository, UserRepository userRepository,
                            KafkaTemplate<String, Object> kafkaTemplate) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public OrderResponse createOrder(OrderCreation orderCreation, ObjectId id) {
        log.info("Order Service :: Order creation in progress..");
        Order order = OrderMapper.mapOrderToEntity(orderCreation);
        order.setUserId(id);
        order.setStatus(Order.Status.PENDING);

        addTimeStamp(order, Order.Status.PENDING);

        Order saveOrder = orderRepository.save(order);

        User user = userRepository.findById(id).orElseThrow(
                () -> new UserNotFoundException("User with provided detail not found.")
        );
        user.getOrderList().add(saveOrder);
        userRepository.save(user);

        // Once's orders gets saved in database a new event will be generated and send to kafka topic
        publishEvent("order_event", buildEvent(saveOrder, user));

        return OrderMapper.orderResponseToUser(saveOrder);
    }

    @Override
    public Page<OrderResponse> fetchAllOrders(int pageNo, int pageSize, User user) {
        log.info("Order Service :: Fetching orders for user ID: {}, page: {}, size: {}", user.getId(), pageNo, pageSize);
        // page numbers coming from the controller are already 0 based, so no need to subtract 1 here
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Order> orders = orderRepository.findByUserId(user.getId(), pageable);
        return orders.map(OrderMapper::orderResponseToUser);
    }

    @Override
    public void cancelOrder(ObjectId orderId, User user) {
        log.warn("Order Service :: Cancelling order with id: {}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.warn("Order Service :: Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });

        if (!order.getUserId().equals(user.getId())) {
            log.warn("Order Service :: Unauthorized access. Order {} belongs to a different user.", orderId);
            throw new OrderNotFoundException("You do not own this order.");
        }

        // Orders which are already shipped or delivered cannot be cancelled
        if (!isOrderCancellable(order.getStatus())) {
            log.warn("Order Service :: Attempt to cancel order {} in non-cancellable state: {}", orderId, order.getStatus());
            throw new OrderNotCancellableException(
                    "Cannot cancel order once it is " + order.getStatus()
            );
        }

        /*
        Order is not deleted anymore, we just move it to CANCELLED.
        Deleting was wiping out the timestamps history which we need for tracking.
         */
        order.setStatus(Order.Status.CANCELLED);
        addTimeStamp(order, Order.Status.CANCELLED);

        Order cancelledOrder = orderRepository.save(order);
        log.info("Order Service :: Order marked as CANCELLED: {}", orderId);

        // user should also get a mail about the cancellation, same as any other status change
        publishEvent("order_update_event", buildEvent(cancelledOrder, user));

        log.info("Order Service :: Cancellation completed for orderId: {}", orderId);
    }

    @Override
    public OrderResponse updateOrder(ObjectId orderId, OrderUpdateStatus orderUpdateStatus, User user) {
        log.info("Order Service :: Updating order with id: {}", orderId);
        Order order = orderRepository.findById(orderId).orElseThrow(
                () -> new OrderNotFoundException("Order not found with id: " + orderId)
        );

        if (!order.getUserId().equals(user.getId())) {
            throw new OrderNotFoundException("Order not found with id: " + orderId);
        }

        Order.Status newStatus = getStatus(orderUpdateStatus, order);

        order.setStatus(newStatus);
        addTimeStamp(order, newStatus);

        Order updatedOrder = orderRepository.save(order);

        publishEvent("order_update_event", buildEvent(updatedOrder, user));
        log.info("Order Service :: Order update event sent for status: {}", newStatus);

        return OrderMapper.orderResponseToUser(updatedOrder);
    }

    // keeps the old timestamps and just adds an entry for the new status
    private void addTimeStamp(Order order, Order.Status status) {
        Map<String, LocalDateTime> timeStamps = order.getTimeStamps();
        if (timeStamps == null) {
            timeStamps = new HashMap<>();
        }
        timeStamps.put(status.name(), LocalDateTime.now());
        order.setTimeStamps(timeStamps);
    }

    // same event is needed on create, update and cancel, so building it at one place
    private OrderEventDTO buildEvent(Order order, User user) {
        return OrderEventDTO.builder()
                .orderId(order.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .eventCreationTime(LocalDateTime.now())
                .items(order.getItems())
                .amount(order.getAmount())
                .status(order.getStatus())
                .build();
    }

    /*
    Sends the event to kafka without blocking the request thread.
    Earlier we were calling join() here, which made the whole api wait for kafka
    and also failed the request when the broker was down, even though the order was already saved.
     */
    private void publishEvent(String topic, OrderEventDTO event) {
        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, event);
        future.whenComplete((result, exception) -> {
            if (exception != null) {
                log.error("Order Service :: Kafka send failed for topic {} : {}", topic, exception.getMessage());
            } else {
                log.info("Order Service :: Event sent to topic: {}", topic);
            }
        });
    }

    private Order.Status getStatus(OrderUpdateStatus orderUpdateStatus, Order order) {
        Order.Status currentStatus = order.getStatus();
        Order.Status newStatus = orderUpdateStatus.getStatus();

        // Once cancelled, no further updates are allowed
        if (currentStatus == Order.Status.CANCELLED) {
            throw new OrderNotCancellableException("Order is cancelled and cannot be updated further.");
        }

        // Prevent backward movement (e.g., SHIPPED → PROCESSING)
        if (newStatus.ordinal() < currentStatus.ordinal()) {
            throw new OrderNotCancellableException(
                    "Invalid status update: cannot move backward from " + currentStatus + " to " + newStatus
            );
        }

        // Allow cancellation only for early stages
        if (newStatus == Order.Status.CANCELLED && !isOrderCancellable(currentStatus)) {
            throw new OrderNotCancellableException(
                    "Cannot cancel order once it has reached " + currentStatus + " stage."
            );
        }
        return newStatus;
    }

    @Override
    public OrderResponse fetchOrderViaId(ObjectId id, User user) {
        log.info("Order Service :: Fetching order with id: {}", id);
        Order order = orderRepository.findById(id).orElseThrow(
                () -> new OrderNotFoundException("Order not found with id: " + id)
        );

        if (!order.getUserId().equals(user.getId())) {
            throw new OrderNotFoundException("Order not found with id: " + id);
        }

        return OrderMapper.orderResponseToUser(order);
    }

    private boolean isOrderCancellable(Order.Status status) {
        return status == Order.Status.PENDING
                || status == Order.Status.CONFIRMED
                || status == Order.Status.PROCESSING
                || status == Order.Status.PACKED;
    }
}
