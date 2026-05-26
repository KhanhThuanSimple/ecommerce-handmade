package com.handmade.handmade_api.modules.order.repository;

import com.handmade.handmade_api.modules.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserIdOrderByIdDesc(Long userId);
}