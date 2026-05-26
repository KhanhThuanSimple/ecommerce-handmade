package com.handmade.handmade_api.modules.order.DTOs;


import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequestDTO {
    private String id;
    private Long user_id;
    private String full_name;
    private String phone;
    private String address;
    private BigDecimal total_amount;
    private BigDecimal discount_amount;
    private BigDecimal payable_amount;
    private String voucher_code;
    private String payment_method;
    private String status;
    private List<ItemDTO> items;

    @Data
    public static class ItemDTO {
        private Long product_id;
        private String product_name;
        private BigDecimal price;
        private Integer quantity;
        private Long variant_id;
    }
}