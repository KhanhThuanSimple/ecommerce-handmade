package com.handmade.handmade_api.modules.products.repository;

import com.handmade.handmade_api.modules.products.entity.ProductVariant;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    /**
     * 1. Giữ hàng tạm (Chạy ngay khi tạo đơn cho cả COD và VNPay)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE product_variants
        SET reserved = reserved + CAST(:qty AS INTEGER)
        WHERE product_id = CAST(:prodId AS BIGINT)
          AND (:variantId IS NULL OR id = CAST(:variantId AS BIGINT) OR id = CAST(:prodId AS BIGINT))
          AND (inventory - reserved) >= CAST(:qty AS INTEGER)
        """, nativeQuery = true)
    int reserveStock(
            @Param("prodId") Long prodId,
            @Param("variantId") Long variantId,
            @Param("qty") Integer qty
    );

    /**
     * 2. Thanh toán ok (VNPay thành công) hoặc Đơn COD xuất kho => Trừ kho thật, hạ hàng giữ tạm
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE product_variants
        SET inventory = inventory - CAST(:qty AS INTEGER),
            reserved = reserved - CAST(:qty AS INTEGER)
        WHERE product_id = CAST(:prodId AS BIGINT)
          AND (:variantId IS NULL OR id = CAST(:variantId AS BIGINT) OR id = CAST(:prodId AS BIGINT))
          AND reserved >= CAST(:qty AS INTEGER)
        """, nativeQuery = true)
    int confirmReservedStock(
            @Param("prodId") Long prodId,
            @Param("variantId") Long variantId,
            @Param("qty") Integer qty
    );

    /**
     * 3. Hủy đơn / Giao dịch VNPay thất bại => Nhả lượng hàng giữ tạm về lại kho chung
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE product_variants
        SET reserved = reserved - CAST(:qty AS INTEGER)
        WHERE product_id = CAST(:prodId AS BIGINT)
          AND (:variantId IS NULL OR id = CAST(:variantId AS BIGINT) OR id = CAST(:prodId AS BIGINT))
          AND reserved >= CAST(:qty AS INTEGER)
        """, nativeQuery = true)
    int releaseReservedStock(
            @Param("prodId") Long prodId,
            @Param("variantId") Long variantId,
            @Param("qty") Integer qty
    );
}