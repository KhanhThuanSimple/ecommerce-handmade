package com.handmade.handmade_api.modules.products.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "variant_name")
    private String variantName;

    private String sku;

    @Column(name = "price_adjustment")
    private Double priceAdjustment;

    private Integer inventory;

    private Integer reserved;
}
