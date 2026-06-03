package com.handmade.handmade_api.modules.adminorder.controller;

import com.handmade.handmade_api.modules.adminorder.DTO.AdminOrderFilterRequest;
import com.handmade.handmade_api.modules.adminorder.DTO.AdminOrderSummaryResponse;
import com.handmade.handmade_api.modules.adminorder.DTO.OrderUpdateRequest;
import com.handmade.handmade_api.modules.adminorder.service.AdminOrderService;
import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getOrders(
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        AdminOrderFilterRequest filter = AdminOrderFilterRequest.builder()
                .orderId(orderId)
                .userId(userId)
                .phone(phone)
                .orderStatus(orderStatus)
                .paymentMethod(paymentMethod)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .page(page)
                .size(size)
                .build();

        return ResponseEntity.ok(adminOrderService.getOrdersByAdmin(filter));
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminOrderSummaryResponse> getSummary() {
        return ResponseEntity.ok(adminOrderService.getOrderSummary());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(@PathVariable String orderId) {
        return ResponseEntity.ok(adminOrderService.getOrderDetailForAdmin(orderId));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody OrderUpdateRequest updateRequest
    ) {
        return ResponseEntity.ok(adminOrderService.updateOrderStatus(orderId, updateRequest));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderId,
            @RequestParam String reason
    ) {
        return ResponseEntity.ok(adminOrderService.cancelOrder(orderId, reason));
    }
}