package com.handmade.handmade_api.modules.products.repository;

import com.handmade.handmade_api.modules.products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Bê nguyên xi 100% câu lệnh SQL chạy đúng dưới DB của bạn vào đây
    @Query(value = "SELECT " +
            "    p.id, " +
            "    p.name, " +
            "    p.base_price, " +
            "    c.name AS category_name, " +
            "    p.category_id, " +
            "    pi.image_url, " +
            "    p.description, " +
            "    CAST(COALESCE(SUM(pv.inventory), 0) AS INTEGER) AS total_inventory, " +
            "    5.0 AS rating, " +
            "    0 AS comment_count, " +
            "    0 AS view_count, " +
            "    p.status, " +
            "    p.sold_count " +
            "FROM products p " +
            "INNER JOIN categories c ON p.category_id = c.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN product_variants pv ON p.id = pv.product_id " +
            "GROUP BY p.id, p.name, p.base_price, c.name, p.category_id, pi.image_url, p.description, p.status, p.sold_count",
            nativeQuery = true)
    List<Object[]> findAllProductsRaw();
}