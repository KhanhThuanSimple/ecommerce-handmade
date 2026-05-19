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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final CartService cartService;
    private final VoucherService voucherService;

    public OrderService(OrderRepository orderRepository, ProductService productService, CartService cartService, VoucherService voucherService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.cartService = cartService;
        this.voucherService = voucherService;
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        if (orderRepository.existsById(request.getId())) {
            throw new RuntimeException("Đơn hàng đã tồn tại: " + request.getId());
        }
        Order order = mapToEntity(request);
        if (shouldProcessInventoryAndCart(order)) {
            processOrderFulfillment(order);
        }
        orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrder(String orderId, OrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderId));

        order.setFullName(request.getFullName());
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

        orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse patchOrder(String orderId, Map<String, Object> updates) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderId));

        String oldStatus = order.getStatus();

        if (updates.containsKey("status")) {
            order.setStatus((String) updates.get("status"));
        }
        if (updates.containsKey("paymentMethod")) {
            order.setPaymentMethod((String) updates.get("paymentMethod"));
        }
        if (updates.containsKey("fullName")) {
            order.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("phone")) {
            order.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("address")) {
            order.setAddress((String) updates.get("address"));
        }

        if (updates.containsKey("status") && isPaidStatus((String) updates.get("status")) && !isPaidStatus(oldStatus)) {
            processOrderFulfillment(order);
        }

        orderRepository.save(order);
        return mapToResponse(order);
    }

    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderId));
        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private boolean shouldProcessInventoryAndCart(Order order) {
        String paymentMethod = order.getPaymentMethod() == null ? "" : order.getPaymentMethod().trim().toUpperCase();
        String status = order.getStatus() == null ? "" : order.getStatus().trim().toLowerCase();
        return paymentMethod.equals("COD") || status.contains("nhận hàng") || status.equalsIgnoreCase("thanh toán khi nhận hàng");
    }

    private boolean isPaidStatus(String status) {
        return status != null && status.trim().equalsIgnoreCase("Đã thanh toán");
    }

    private void processOrderFulfillment(Order order) {
        Map<Long, Integer> orderedQuantities = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));

        orderedQuantities.forEach((productId, qty) -> productService.decreaseInventory(productId, qty));

        if (order.getUserId() != null) {
            cartService.deductOrderedItems(order.getUserId(), orderedQuantities);
        }

        if (order.getVoucherCode() != null && !order.getVoucherCode().isBlank()) {
            voucherService.applyVoucherCode(order.getVoucherCode());
        }
    }

    private Order mapToEntity(OrderRequest request) {
        Order order = Order.builder()
                .id(request.getId())
                .userId(request.getUserId())
                .fullName(request.getFullName())
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

        List<OrderItem> items = mapItems(order, request.getItems());
        order.setItems(items);
        return order;
    }

    private List<OrderItem> mapItems(Order order, List<OrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream().map(item -> {
            // Lấy ID sản phẩm an toàn (bất kể FE truyền dạng bọc hay dạng phẳng từ giỏ hàng)
            Long targetProductId = item.getSafeProductId();
            
            if (targetProductId == null) {
                throw new RuntimeException("Không thể xác định ID sản phẩm cho đơn mua!");
            }

            // Gọi ProductService lấy thông tin chuẩn từ DB để điền vào đơn hàng
            var dbProduct = productService.getProductById(targetProductId);

            return OrderItem.builder()
                    .order(order)
                    .productId(dbProduct.getId())
                    .productName(dbProduct.getName())
                    .productPrice(dbProduct.getPrice()) // Sử dụng giá gốc từ DB để an toàn thanh toán
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

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .fullName(order.getFullName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .payableAmount(order.getPayableAmount())
                .voucherCode(order.getVoucherCode())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .date(order.getDate())
                .build();
    }
}
