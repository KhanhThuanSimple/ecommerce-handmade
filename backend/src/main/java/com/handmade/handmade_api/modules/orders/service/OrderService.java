package com.handmade.handmade_api.modules.orders.service;

import com.handmade.handmade_api.modules.cart.service.CartService;
import com.handmade.handmade_api.modules.orders.dto.OrderItemRequest;
import com.handmade.handmade_api.modules.orders.dto.OrderRequest;
import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import com.handmade.handmade_api.modules.orders.entity.Order;
import com.handmade.handmade_api.modules.orders.entity.OrderItem;
import com.handmade.handmade_api.modules.orders.repository.OrderRepository;
import com.handmade.handmade_api.modules.products.service.ProductService;
import com.handmade.handmade_api.modules.voucher.service.VoucherService;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final CartService cartService;
    private final VoucherService voucherService;

    // Đã loại bỏ VnPayService để giải quyết triệt để lỗi kết nối lỏng (coupling)
    public OrderService(OrderRepository orderRepository, ProductService productService, CartService cartService,
                        VoucherService voucherService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.cartService = cartService;
        this.voucherService = voucherService;
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        if (request.getId() != null && !request.getId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không được phép cung cấp id khi tạo đơn hàng mới");
        }

        normalizeOrderRequest(request);

        Order order = mapToEntity(request);
        order.setId(generateOrderId());

        if (shouldProcessInventoryAndCart(order)) {
            validateOrderItemsStock(order);
            processOrderFulfillment(order);
        }

        orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrder(String orderId, OrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        boolean wasFulfillmentProcessed = hasInventoryBeenDeducted(order);

        normalizeOrderRequest(request);

        order.setFullName(request.getFullName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setPhone(request.getPhone());
        order.setAddress(request.getAddress());
        order.setTotalAmount(request.getTotalAmount());
        order.setDiscountAmount(request.getDiscountAmount());
        order.setPayableAmount(request.getPayableAmount());
        order.setVoucherCode(request.getVoucherCode());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(request.getStatus());
        order.setDate(request.getDate());
        order.setUserId(request.getUserId());

        order.getItems().clear();
        order.getItems().addAll(mapItems(order, request.getItems()));

        if (!wasFulfillmentProcessed && shouldProcessInventoryAndCart(order)) {
            validateOrderItemsStock(order);
            processOrderFulfillment(order);
        }

        orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse patchOrder(String orderId, Map<String, Object> updates) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        String oldStatus = order.getStatus();
        boolean wasFulfillmentProcessed = hasInventoryBeenDeducted(order);

        if (updates.containsKey("status")) {
            order.setStatus(normalizeStatus((String) updates.get("status")));
        }
        if (updates.containsKey("paymentMethod")) {
            order.setPaymentMethod(normalizePaymentMethod((String) updates.get("paymentMethod")));
        }
        if (updates.containsKey("fullName")) {
            order.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("customerEmail")) {
            order.setCustomerEmail((String) updates.get("customerEmail"));
        }
        if (updates.containsKey("phone")) {
            order.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("address")) {
            order.setAddress((String) updates.get("address"));
        }
        if (updates.containsKey("vnpayTranNo")) {
            order.setVnpayTranNo((String) updates.get("vnpayTranNo"));
        }

        boolean statusChangedToPaid = updates.containsKey("status")
                && isPaidStatus(order.getStatus())
                && !isPaidStatus(oldStatus);

        if (!wasFulfillmentProcessed && statusChangedToPaid) {
            validateOrderItemsStock(order);
            processOrderFulfillment(order);
        }

        orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generateOrderId() {
        return "ORD-" + System.currentTimeMillis();
    }

    /**
     * COD: trừ kho + giỏ ngay khi tạo đơn.
     * VNPay: chỉ trừ kho + giỏ khi trạng thái chuyển sang đã thanh toán.
     */
    private boolean shouldProcessInventoryAndCart(Order order) {
        return isCodPayment(order.getPaymentMethod()) || isPaidStatus(order.getStatus());
    }

    /**
     * Đơn COD hoặc đơn đã thanh toán được coi là đã xử lý kho.
     */
    private boolean hasInventoryBeenDeducted(Order order) {
        return isCodPayment(order.getPaymentMethod()) || isPaidStatus(order.getStatus());
    }

    private boolean isPaidStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return normalized.equals("đã thanh toán")
                || normalized.equals("paid")
                || normalized.equals("completed")
                || normalized.equals("payment success")
                || normalized.equals("success");
    }

    private boolean isCodPayment(String paymentMethod) {
        if (paymentMethod == null) {
            return false;
        }
        String normalized = paymentMethod.trim().toUpperCase();
        return normalized.equals("COD")
                || normalized.contains("CASH")
                || normalized.contains("NHẬN HÀNG")
                || normalized.contains("THANH TOÁN KHI NHẬN HÀNG");
    }

    // Tự xử lý nhận diện chuỗi VNPay nội bộ để tránh import phụ thuộc
    private boolean isVnPayPayment(String paymentMethod) {
        if (paymentMethod == null) {
            return false;
        }
        String normalized = paymentMethod.trim().toUpperCase();
        return normalized.equals("VNPAY") || normalized.contains("VNPAY") || normalized.contains("VN PAY");
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null) {
            return null;
        }
        String normalized = paymentMethod.trim().toUpperCase();
        if (normalized.equals("COD")
                || normalized.contains("CASH")
                || normalized.contains("NHẬN HÀNG")) {
            return "COD";
        }
        if (isVnPayPayment(paymentMethod)) {
            return "VNPAY";
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim();
        String lower = normalized.toLowerCase();

        if (lower.equals("chờ thanh toán") || lower.equals("pending")) {
            return "Chờ thanh toán";
        }
        if (lower.equals("thanh toán khi nhận hàng")
                || lower.equals("cash_on_delivery")
                || lower.equals("cod")) {
            return "Thanh toán khi nhận hàng";
        }
        if (lower.equals("đã thanh toán") || lower.equals("paid") || lower.equals("completed")) {
            return "Đã thanh toán";
        }
        if (lower.equals("thanh toán thất bại") || lower.equals("failed") || lower.equals("payment failed")) {
            return "Thanh toán thất bại";
        }
        return normalized;
    }

    private void normalizeOrderRequest(OrderRequest request) {
        request.setPaymentMethod(normalizePaymentMethod(request.getPaymentMethod()));
        request.setStatus(resolveInitialStatus(request.getStatus(), request.getPaymentMethod()));
        if (request.getDiscountAmount() == null) {
            request.setDiscountAmount(0.0);
        }
        if (request.getPayableAmount() == null) {
            request.setPayableAmount(0.0);
        }
        if (request.getTotalAmount() == null) {
            request.setTotalAmount(0.0);
        }
        if (request.getVoucherCode() != null && request.getVoucherCode().isBlank()) {
            request.setVoucherCode(null);
        }
    }

    private String resolveInitialStatus(String status, String paymentMethod) {
        if (status != null && !status.isBlank()) {
            return normalizeStatus(status);
        }
        if (isCodPayment(paymentMethod)) {
            return "Thanh toán khi nhận hàng";
        }
        if (isVnPayPayment(paymentMethod)) {
            return "Chờ thanh toán";
        }
        return "Chờ thanh toán";
    }

    private void validateOrderItemsStock(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng phải có ít nhất một sản phẩm");
        }
        Map<Long, Integer> quantities = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));
        quantities.forEach(productService::assertSufficientInventory);
    }

    private void processOrderFulfillment(Order order) {
        Map<Long, Integer> orderedQuantities = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));

        orderedQuantities.forEach((productId, qty) -> productService.decreaseInventory(productId, qty));

        if (order.getUserId() != null) {
            cartService.deductOrderedItems(order.getUserId(), orderedQuantities);
        }

        if (order.getVoucherCode() != null && !order.getVoucherCode().isBlank()) {
            try {
                voucherService.applyVoucherCode(order.getVoucherCode());
            } catch (Exception ex) {
                log.warn("Voucher '{}' áp dụng thất bại, bỏ qua voucher cho đơn {}: {}",
                        order.getVoucherCode(), order.getId(), ex.getMessage());
                order.setVoucherCode(null);
            }
        }
    }

    private Order mapToEntity(OrderRequest request) {
        Order order = Order.builder()
                .userId(request.getUserId())
                .fullName(request.getFullName())
                .customerEmail(request.getCustomerEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .totalAmount(request.getTotalAmount())
                .discountAmount(request.getDiscountAmount())
                .payableAmount(request.getPayableAmount())
                .voucherCode(request.getVoucherCode())
                .paymentMethod(request.getPaymentMethod())
                .status(request.getStatus())
                .date(request.getDate())
                .build();

        order.setItems(mapItems(order, request.getItems()));
        return order;
    }

    private List<OrderItem> mapItems(Order order, List<OrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream().map(item -> {
            Long targetProductId = item.getSafeProductId();
            if (targetProductId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xác định ID sản phẩm cho đơn mua!");
            }

            var dbProduct = productService.getProductById(targetProductId);
            Long variantId = productService.getDefaultVariantId(targetProductId);

            return OrderItem.builder()
                    .order(order)
                    .productId(dbProduct.getId())
                    .variantId(variantId)
                    .productName(dbProduct.getName())
                    .productPrice(dbProduct.getPrice())
                    .productImageUrl(dbProduct.getImageUrl())
                    .quantity(item.getQuantity())
                    .build();
        }).collect(Collectors.toList());
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

        String displayDate = order.getDate();
        if ((displayDate == null || displayDate.isBlank()) && order.getCreatedAt() != null) {
            displayDate = order.getCreatedAt().toString();
        }

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
                .date(displayDate)
                .build();
    }
}