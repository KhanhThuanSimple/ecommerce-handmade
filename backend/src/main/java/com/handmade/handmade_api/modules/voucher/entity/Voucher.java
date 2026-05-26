package com.handmade.handmade_api.modules.voucher.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "voucher")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    private String id;

    private String code;
    private String title;
    private String description;
    private String type;
    private Double value;

    @Column(name = "max_discount")
    private Double maxDiscount;

    @Column(name = "min_order")
    private Double minOrder;

    private String target;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "max_order_count")
    private Integer maxOrderCount;

    private Integer quantity;
    private Integer used;
    private String status;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "expired_at")
    private String expiredAt;
}
