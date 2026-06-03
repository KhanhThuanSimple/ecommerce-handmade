package com.handmade.handmade_api.modules.orders.repository;

import com.handmade.handmade_api.modules.orders.entity.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderHistoryRepository
        extends JpaRepository<OrderHistory, Long> {

    List<OrderHistory> findByOrderIdOrderByPerformedAtDesc(String orderId);
}