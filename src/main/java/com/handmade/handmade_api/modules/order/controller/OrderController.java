package com.handmade.handmade_api.modules.order.controller;

import com.handmade.handmade_api.modules.order.DTOs.OrderRequestDTO;
import com.handmade.handmade_api.modules.order.entity.Order;
import com.handmade.handmade_api.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO requestDTO) {
        try {
            Order order = orderService.createOrder(requestDTO);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getOrders(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderDetail(@PathVariable("id") String id) {
        Order order = orderService.getOrderDetail(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }
}
