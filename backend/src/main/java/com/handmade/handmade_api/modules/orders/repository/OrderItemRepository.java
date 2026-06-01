package com.handmade.handmade_api.modules.orders.repository;

import com.handmade.handmade_api.modules.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
            SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END
            FROM OrderItem oi
            JOIN oi.order o
            WHERE o.userId = :userId
              AND oi.productId = :productId
              AND (
                    UPPER(o.status) IN ('COMPLETED', 'PAID', 'SUCCESS')
                    OR o.status = 'Đã thanh toán'
                    OR o.status = 'Thanh toán khi nhận hàng'
              )
            """)
    boolean existsPurchasedProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
