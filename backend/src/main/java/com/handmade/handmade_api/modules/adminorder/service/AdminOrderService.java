package com.handmade.handmade_api.modules.adminorder.service;

import com.handmade.handmade_api.modules.adminorder.DTO.AdminOrderFilterRequest;
import com.handmade.handmade_api.modules.adminorder.DTO.AdminOrderSummaryResponse;
import com.handmade.handmade_api.modules.adminorder.DTO.OrderUpdateRequest;
import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import com.handmade.handmade_api.modules.orders.entity.Order;
import com.handmade.handmade_api.modules.orders.entity.OrderHistory;
import com.handmade.handmade_api.modules.orders.repository.OrderHistoryRepository;
import com.handmade.handmade_api.modules.orders.repository.OrderRepository;
import com.handmade.handmade_api.modules.orders.specification.OrderSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderHistoryRepository orderHistoryRepository;

    public AdminOrderService(OrderRepository orderRepository, OrderHistoryRepository orderHistoryRepository) {
        this.orderRepository = orderRepository;
        this.orderHistoryRepository = orderHistoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByAdmin(AdminOrderFilterRequest filter) {
        log.info("Fetching orders with filter: {}", filter);

        Pageable pageable = PageRequest.of(
                filter.getPage() != null ? filter.getPage() : 0,
                filter.getSize() != null ? filter.getSize() : 20
        );

        Page<Order> orders = orderRepository.findAll(
                OrderSpecification.buildFilterSpecification(filter),
                pageable
        );

        return orders.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetailForAdmin(String orderId) {
        log.info("Viewing order detail: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        OrderResponse response = mapToResponse(order);

        // Add order history
        List<OrderHistory> history = orderHistoryRepository.findByOrderIdOrderByPerformedAtDesc(orderId);
        response.setHistory(history.stream().map(this::mapToHistoryResponse).collect(Collectors.toList()));

        return response;
    }

    @Transactional
    public OrderResponse updateOrderStatus(String orderId, OrderUpdateRequest updateRequest) {
        log.info("Updating order {} status to {}", orderId, updateRequest.getOrderStatus());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        String oldStatus = order.getStatus();
        String newStatus = updateRequest.getOrderStatus();

        // Validate status transition
        validateStatusTransition(oldStatus, newStatus);

        // Update order
        if (newStatus != null) {
            order.setStatus(newStatus);
        }

        // Log to history
        OrderHistory history = OrderHistory.builder()
                .orderId(orderId)
                .action("STATUS_CHANGED")
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(updateRequest.getNote())
                .performedBy("ADMIN")
                .performedByRole("ADMIN")
                .build();
        orderHistoryRepository.save(history);

        Order savedOrder = orderRepository.save(order);
        OrderResponse response = mapToResponse(savedOrder);
        response.setHistory(List.of(mapToHistoryResponse(history)));

        return response;
    }

    @Transactional
    public OrderResponse cancelOrder(String orderId, String reason) {
        log.info("Cancelling order {} with reason: {}", orderId, reason);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        // Check if order can be cancelled
        if (order.getStatus().equals("Hoàn thành") || order.getStatus().equals("Đã hủy")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể hủy đơn hàng đã hoàn thành hoặc đã hủy");
        }

        String oldStatus = order.getStatus();
        order.setStatus("Đã hủy");

        // TODO: Restore inventory if needed
        // restoreInventory(order);

        OrderHistory history = OrderHistory.builder()
                .orderId(orderId)
                .action("CANCELLED")
                .oldStatus(oldStatus)
                .newStatus("Đã hủy")
                .note("Hủy bởi Admin: " + reason)
                .performedBy("ADMIN")
                .performedByRole("ADMIN")
                .build();
        orderHistoryRepository.save(history);

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public AdminOrderSummaryResponse getOrderSummary() {
        log.info("Fetching order summary");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);

        // Tuần hiện tại (bắt đầu từ thứ Hai)
        LocalDateTime startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay();
        // Tháng hiện tại
        LocalDateTime startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();

        // 1. Doanh thu theo các mốc
        Double totalRevenue = orderRepository.calculateTotalRevenue();
        Double todayRevenue = orderRepository.calculateRevenueByRange(startOfToday, endOfToday);
        Double thisWeekRevenue = orderRepository.calculateRevenueByRange(startOfWeek, now.plusNanos(1));
        Double thisMonthRevenue = orderRepository.calculateRevenueByRange(startOfMonth, now.plusNanos(1));

        // 2. Thống kê đơn hàng
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.count(OrderSpecification.buildFilterSpecification(
                AdminOrderFilterRequest.builder().orderStatus("Chờ thanh toán").build()));
        long processingOrders = orderRepository.count(OrderSpecification.buildFilterSpecification(
                AdminOrderFilterRequest.builder().orderStatus("Đang xử lý").build()));
        long completedOrders = orderRepository.count(OrderSpecification.buildFilterSpecification(
                AdminOrderFilterRequest.builder().orderStatus("Hoàn thành").build()));
        long cancelledOrders = orderRepository.count(OrderSpecification.buildFilterSpecification(
                AdminOrderFilterRequest.builder().orderStatus("Đã hủy").build()));

        // 3. Thống kê phương thức thanh toán
        List<Object[]> paymentStats = orderRepository.getPaymentMethodStats();
        Map<String, Double> paymentMethodStats = new LinkedHashMap<>();
        for (Object[] stat : paymentStats) {
            paymentMethodStats.put((String) stat[0], (Double) stat[2]);
        }

        return AdminOrderSummaryResponse.builder()
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .processingOrders(processingOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .thisWeekRevenue(thisWeekRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .paymentMethodStats(paymentMethodStats)
                .topProducts(getTopProducts())
                .dailyRevenue(getDailyRevenue())
                .build();
    }

    private void validateStatusTransition(String oldStatus, String newStatus) {
        // Define valid status transitions
        Map<String, List<String>> validTransitions = Map.of(
                "Chờ thanh toán", List.of("Đang xử lý", "Đã hủy"),
                "Đang xử lý", List.of("Đang giao hàng", "Đã hủy"),
                "Đang giao hàng", List.of("Hoàn thành", "Đã hủy"),
                "Hoàn thành", List.of(),
                "Đã hủy", List.of()
        );

        if (newStatus != null && validTransitions.containsKey(oldStatus)) {
            if (!validTransitions.get(oldStatus).contains(newStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Không thể chuyển trạng thái từ '%s' sang '%s'", oldStatus, newStatus));
            }
        }
    }

    private Map<String, Long> getTopProducts() {
        // Implement logic to get top selling products
        // This would require additional queries
        return new HashMap<>();
    }

    private Map<String, Double> getDailyRevenue() {
        Map<String, Double> dailyRevenue = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            // Query revenue for this date
            dailyRevenue.put(date.format(formatter), 0.0);
        }
        return dailyRevenue;
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .productPrice(item.getProductPrice())
                        .productImageUrl(item.getProductImageUrl())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .fullName(order.getFullName())
                .customerEmail(order.getCustomerEmail())
                .phone(order.getPhone())
                .address(order.getAddress())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .payableAmount(order.getPayableAmount())
                .voucherCode(order.getVoucherCode())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .date(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .build();
    }

    private OrderResponse.OrderHistoryResponse mapToHistoryResponse(OrderHistory history) {
        return OrderResponse.OrderHistoryResponse.builder()
                .action(history.getAction())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .note(history.getNote())
                .performedBy(history.getPerformedBy())
                .performedByRole(history.getPerformedByRole())
                .performedAt(history.getPerformedAt())
                .build();
    }
}