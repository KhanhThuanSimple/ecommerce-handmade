package com.handmade.handmade_api.modules.products.repository;

import com.handmade.handmade_api.modules.products.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductId(Long productId);
}