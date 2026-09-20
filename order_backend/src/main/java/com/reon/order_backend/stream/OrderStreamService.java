package com.reon.order_backend.stream;

import com.reon.order_backend.dto.order.OrderResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/*
Holds the browser connections which are watching an order.

One order can be open in more than one tab, so every order id keeps a list of emitters.
The map is only in memory, which is fine for a single instance. With more than one
instance a client would only get the events of the instance it is connected to, that
would need something shared like redis pub/sub.
 */
@Service
@Slf4j
public class OrderStreamService {

    // browser reconnects on its own, so the connection does not have to live forever
    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String orderId, OrderResponse snapshot) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);

        emitters.computeIfAbsent(orderId, key -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("Order Stream :: Client watching order {}, open connections: {}", orderId, count(orderId));

        emitter.onCompletion(() -> remove(orderId, emitter));
        emitter.onTimeout(() -> {
            remove(orderId, emitter);
            emitter.complete();
        });
        emitter.onError(exception -> remove(orderId, emitter));

        // current state goes out immediately, so the screen is correct from the first frame
        send(orderId, emitter, "status", snapshot);
        return emitter;
    }

    // called once the consumer has handled an event for this order
    public void publish(String orderId, OrderResponse order) {
        List<SseEmitter> open = emitters.get(orderId);
        if (open == null || open.isEmpty()) {
            return;
        }

        log.info("Order Stream :: Pushing {} to {} client(s) of order {}", order.getStatus(), open.size(), orderId);
        open.forEach(emitter -> send(orderId, emitter, "status", order));
    }

    /*
    Idle connections get dropped by proxies, so a ping goes out every 25 seconds
    just to keep them alive. The frontend ignores these.
     */
    @Scheduled(fixedRate = 25000)
    public void heartbeat() {
        emitters.forEach((orderId, open) -> open.forEach(emitter -> send(orderId, emitter, "ping", "keep-alive")));
    }

    private void send(String orderId, SseEmitter emitter, String eventName, Object payload) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(payload));
        } catch (IOException | IllegalStateException exception) {
            // client went away, drop it instead of trying again
            remove(orderId, emitter);
        }
    }

    private void remove(String orderId, SseEmitter emitter) {
        List<SseEmitter> open = emitters.get(orderId);
        if (open == null) {
            return;
        }

        open.remove(emitter);
        if (open.isEmpty()) {
            emitters.remove(orderId);
        }
    }

    private int count(String orderId) {
        return emitters.getOrDefault(orderId, List.of()).size();
    }
}
