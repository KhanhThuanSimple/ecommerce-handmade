package com.handmade.handmade_api.modules.products.repository;

import com.handmade.handmade_api.modules.products.dto.ProductProjection;
import com.handmade.handmade_api.modules.products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 1. LẤY DANH SÁCH SẢN PHẨM CHO NGƯỜI DÙNG (Chỉ lấy 'active')
    @Query(value = "SELECT " +
            "    p.id AS id, p.name AS name, p.base_price AS price, c.name AS categoryName, " +
            "    p.category_id AS categoryId, pi.image_url AS imageUrl, p.description AS description, " +
            "    CAST(COALESCE(SUM(pv.inventory), 0) AS INTEGER) AS totalInventory, " +
            "    CAST(COALESCE(AVG(r.rating), 5.0) AS FLOAT) AS rating, " +
            "    CAST(COALESCE(COUNT(DISTINCT r.id), 0) AS INTEGER) AS commentCount, " +
            "    0 AS viewCount, p.status AS status, p.sold_count AS soldCount " +
            "FROM products p " +
            "INNER JOIN categories c ON p.category_id = c.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN product_variants pv ON p.id = pv.product_id " +
            "LEFT JOIN reviews r ON p.id = r.product_id " +
            "WHERE p.status = 'active' " +
            "GROUP BY p.id, p.name, p.base_price, c.name, p.category_id, pi.image_url, p.description, p.status, p.sold_count",
            nativeQuery = true)
    List<ProductProjection> findAllActiveProducts();

    // 2. LẤY CHI TIẾT 1 SẢN PHẨM (Chỉ lấy nếu sản phẩm vẫn đang 'active')
    @Query(value = "SELECT " +
            "    p.id AS id, p.name AS name, p.base_price AS price, c.name AS categoryName, " +
            "    p.category_id AS categoryId, pi.image_url AS imageUrl, p.description AS description, " +
            "    CAST(COALESCE(SUM(pv.inventory), 0) AS INTEGER) AS totalInventory, " +
            "    CAST(COALESCE(AVG(r.rating), 5.0) AS FLOAT) AS rating, " +
            "    CAST(COALESCE(COUNT(DISTINCT r.id), 0) AS INTEGER) AS commentCount, " +
            "    0 AS viewCount, p.status AS status, p.sold_count AS soldCount " +
            "FROM products p " +
            "INNER JOIN categories c ON p.category_id = c.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN product_variants pv ON p.id = pv.product_id " +
            "LEFT JOIN reviews r ON p.id = r.product_id " +
            "WHERE p.id = :id AND p.status = 'active' " +
            "GROUP BY p.id, p.name, p.base_price, c.name, p.category_id, pi.image_url, p.description, p.status, p.sold_count",
            nativeQuery = true)
    ProductProjection findProductDetailRawById(@Param("id") Long id);
}