package com.handmade.handmade_api.modules.orders.repository;

import com.handmade.handmade_api.modules.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Kiểm tra user đã mua sản phẩm này trong đơn đã hoàn thành chưa.
     */
    @Query("""
            SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END
            FROM OrderItem oi
            JOIN oi.order o
            WHERE o.userId = :userId
              AND oi.productId = :productId
              AND (
                    UPPER(o.status) IN ('COMPLETED', 'PAID', 'SUCCESS', 'DELIVERED')
                    OR o.status = 'Đã thanh toán'
                    OR o.status = 'Thanh toán khi nhận hàng'
                    OR o.status = 'Đã giao hàng'
              )
            """)
    boolean existsPurchasedProduct(@Param("userId") Long userId, @Param("productId") Long productId);

    /**
     * Lấy tất cả order_items của user từ đơn đã hoàn thành.
     * Dùng để tính danh sách "chưa đánh giá".
     */
    @Query("""
            SELECT oi
            FROM OrderItem oi
            JOIN FETCH oi.order o
            WHERE o.userId = :userId
              AND (
                    UPPER(o.status) IN ('COMPLETED', 'PAID', 'SUCCESS', 'DELIVERED')
                    OR o.status = 'Đã thanh toán'
                    OR o.status = 'Thanh toán khi nhận hàng'
                    OR o.status = 'Đã giao hàng'
              )
            ORDER BY o.createdAt DESC
            """)
    List<OrderItem> findCompletedOrderItemsByUserId(@Param("userId") Long userId);
}
