package com.handmade.handmade_api.modules.orders.repository;

import com.handmade.handmade_api.modules.orders.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserId(Long userId);
}
