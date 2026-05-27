package com.handmade.handmade_api.modules.orders.controller;

import com.handmade.handmade_api.modules.orders.dto.OrderRequest;
import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import com.handmade.handmade_api.modules.orders.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(@PathVariable String id, @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OrderResponse> patchOrder(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(orderService.patchOrder(id, updates));
    }
}