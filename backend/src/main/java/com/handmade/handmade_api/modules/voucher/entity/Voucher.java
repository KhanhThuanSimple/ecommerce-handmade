package com.handmade.handmade_api.modules.voucher.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(name = "voucher_type", nullable = false)
    private String voucherType;

    @Column(name = "value_amount", nullable = false)
    private Double valueAmount;

    @Column(name = "max_discount_amount")
    private Double maxDiscountAmount;

    @Column(name = "min_order_amount")
    private Double minOrderAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count")
    private Integer usedCount;

    @JsonProperty("type")
    public String getType() {
        return voucherType;
    }

    @JsonProperty("value")
    public Double getValue() {
        return valueAmount;
    }

    @JsonProperty("maxDiscount")
    public Double getMaxDiscount() {
        return maxDiscountAmount;
    }

    @JsonProperty("minOrder")
    public Double getMinOrder() {
        return minOrderAmount == null ? 0.0 : minOrderAmount;
    }

    @JsonProperty("quantity")
    public Integer getQuantity() {
        return usageLimit == null ? 0 : usageLimit;
    }

    @JsonProperty("used")
    public Integer getUsed() {
        return usedCount == null ? 0 : usedCount;
    }

    @JsonProperty("status")
    public String getStatus() {
        return "ACTIVE";
    }

    @JsonProperty("target")
    public String getTarget() {
        return "ALL";
    }

    @JsonProperty("startDate")
    public String getStartDate() {
        return "2000-01-01T00:00:00.000Z";
    }

    @JsonProperty("expiredAt")
    public String getExpiredAt() {
        return "2099-12-31T23:59:59.000Z";
    }
}
