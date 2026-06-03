package com.handmade.handmade_api.modules.adminorder.DTO;


import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminOrderResponse {
    private String id;
    private Long userId;
    private String userEmail;
    private String userName;
    private String fullName;
    private String phone;
    private String address;
    private List<AdminOrderItemResponse> items;
    private Double totalAmount;
    private Double discountAmount;
    private Double payableAmount;
    private String voucherCode;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String shippingStatus;
    private String vnpayTranNo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String note;
    private List<OrderResponse.OrderHistoryResponse> history;

    @Data
    @Builder
    public static class AdminOrderItemResponse {
        private Long productId;
        private String productName;
        private String productImageUrl;
        private Double productPrice;
        private Integer quantity;
        private Double subtotal;
    }
}


