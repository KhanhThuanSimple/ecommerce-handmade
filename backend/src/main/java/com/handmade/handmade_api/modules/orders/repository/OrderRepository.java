package com.handmade.handmade_api.modules.orders.repository;

import com.handmade.handmade_api.modules.orders.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String>,
        JpaSpecificationExecutor<Order> {

    List<Order> findByUserId(Long userId);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status IN :statuses")
    List<Order> findByStatusIn(@Param("statuses") List<String> statuses);

    // Đếm đơn hàng theo khoảng thời gian
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt < :end")
    Long countOrdersByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Tính doanh thu theo khoảng thời gian (loại trừ đơn bị hủy)
    @Query("SELECT COALESCE(SUM(o.payableAmount), 0) FROM Order o " +
            "WHERE o.createdAt >= :start AND o.createdAt < :end " +
            "AND o.status NOT IN ('CANCELLED', 'REFUNDED')")
    Double calculateRevenueByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.payableAmount), 0) FROM Order o WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')")
    Double calculateTotalRevenue();

    @Query("""
        SELECT o.paymentMethod,
               COUNT(o),
               COALESCE(SUM(o.payableAmount),0)
        FROM Order o
        WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY o.paymentMethod
    """)
    List<Object[]> getPaymentMethodStats();
}