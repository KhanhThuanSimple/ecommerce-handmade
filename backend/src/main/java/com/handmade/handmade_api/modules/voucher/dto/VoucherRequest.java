package com.handmade.handmade_api.modules.voucher.dto;

import lombok.Data;

@Data
public class VoucherRequest {
    private String id;
    private String code;
    private String title;
    private String description;
    private String type;
    private Double value;
    private Double maxDiscount;
    private Double minOrder;
    private String target;
    private Long userId;
    private Integer maxOrderCount;
    private Integer quantity;
    private Integer used;
    private String status;
    private String startDate;
    private String expiredAt;
}
