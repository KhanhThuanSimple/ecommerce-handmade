    package com.handmade.handmade_api.modules.products.entity;


    import jakarta.persistence.*;
    import lombok.*;
    import java.math.BigDecimal;

    @Entity
    @Table(name = "product_variants")
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public class ProductVariant {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "product_id", nullable = false)
        private Long productId;

        @Column(name = "variant_name")
        private String variantName;

        private String sku;

        @Column(name = "price_adjustment")
        private BigDecimal priceAdjustment;

        @Column(nullable = false)
        private Integer inventory;
    }