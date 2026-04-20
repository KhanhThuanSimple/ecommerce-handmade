package com.handmade.handmade_api.repository;

import com.handmade.handmade_api.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}