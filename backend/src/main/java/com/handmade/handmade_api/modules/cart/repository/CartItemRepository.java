package com.handmade.handmade_api.modules.cart.repository;

import com.handmade.handmade_api.modules.cart.dto.CartItemProjection;
import com.handmade.handmade_api.modules.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    List<CartItem> findByCartId(Long cartId);

    @Modifying
    void deleteByCartIdAndProductId(Long cartId, Long productId);

    // 🌟 NATIVE SQL TỐI ƯU HÓA ĐỌC PHẲNG GIỎ HÀNG CHO FRONTEND
    @Query(value = "SELECT ci.product_id AS productId, p.name AS productName, " +
            "p.base_price AS price, pi.image_url AS imageUrl, ci.quantity AS quantity, " +
            "CAST(COALESCE(SUM(pv.inventory), 0) AS INTEGER) AS maxInventory " +
            "FROM cart_items ci " +
            "INNER JOIN carts c ON ci.cart_id = c.id " +
            "INNER JOIN products p ON ci.product_id = p.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN product_variants pv ON p.id = pv.product_id " +
            "WHERE c.user_id = :userId " +
            "GROUP BY ci.product_id, p.name, p.base_price, pi.image_url, ci.quantity",
            nativeQuery = true)
    List<CartItemProjection> findCartDetailsByUserId(@Param("userId") Long userId);
}