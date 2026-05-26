package com.handmade.handmade_api.modules.adminProduct.repository;

import com.handmade.handmade_api.modules.products.dto.ProductProjection;
import com.handmade.handmade_api.modules.products.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminProductRepository extends JpaRepository<Product, Long> {

    // 1. TÌM KIẾM, PHÂN TRANG VÀ LỌC NÂNG CAO CHaaO ADMIN (TỐI ƯU SIÊU TỐC)
    @Query(value = "SELECT " +
            "    p.id AS id, " +
            "    p.name AS name, " +
            "    p.base_price AS price, " +
            "    c.name AS categoryName, " +
            "    p.category_id AS categoryId, " +
            "    pi.image_url AS imageUrl, " +
            "    p.description AS description, " +
            "    COALESCE(v.total_inventory, 0) AS totalInventory, " +
            "    COALESCE(r.avg_rating, 5.0) AS rating, " +
            "    COALESCE(r.comment_count, 0) AS commentCount, " +
            "    0 AS viewCount, " +
            "    p.status AS status, " +
            "    p.sold_count AS soldCount " +
            "FROM products p " +
            "INNER JOIN categories c ON p.category_id = c.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN (" +
            "    SELECT product_id, CAST(SUM(inventory) AS INTEGER) AS total_inventory " +
            "    FROM product_variants " +
            "    GROUP BY product_id" +
            ") v ON p.id = v.product_id " +
            "LEFT JOIN (" +
            "    SELECT product_id, " +
            "           CAST(AVG(rating) AS FLOAT) AS avg_rating, " +
            "           CAST(COUNT(id) AS INTEGER) AS comment_count " +
            "    FROM reviews " +
            "    GROUP BY product_id" +
            ") r ON p.id = r.product_id " +
            "WHERE (:id IS NULL OR p.id = :id) " +
            "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
            "AND (:status IS NULL OR p.status = :status) " +
            // Bộ lọc xử lý trạng thái kho riêng biệt cho Admin
            "AND (CAST(:inventoryStatus AS TEXT) IS NULL OR " +
            "     (:inventoryStatus = 'EMPTY' AND COALESCE(v.total_inventory, 0) = 0) OR " +
            "     (:inventoryStatus = 'LOW' AND COALESCE(v.total_inventory, 0) > 0 AND COALESCE(v.total_inventory, 0) <= 5) OR " +
            "     (:inventoryStatus = 'AVAILABLE' AND COALESCE(v.total_inventory, 0) > 5))",
            countQuery = "SELECT COUNT(*) FROM products p " +
                    "LEFT JOIN (" +
                    "    SELECT product_id, SUM(inventory) AS total_inventory " +
                    "    FROM product_variants " +
                    "    GROUP BY product_id" +
                    ") v ON p.id = v.product_id " +
                    "WHERE (:id IS NULL OR p.id = :id) " +
                    "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                    "AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
                    "AND (:status IS NULL OR p.status = :status) " +
                    "AND (CAST(:inventoryStatus AS TEXT) IS NULL OR " +
                    "     (:inventoryStatus = 'EMPTY' AND COALESCE(v.total_inventory, 0) = 0) OR " +
                    "     (:inventoryStatus = 'LOW' AND COALESCE(v.total_inventory, 0) > 0 AND COALESCE(v.total_inventory, 0) <= 5) OR " +
                    "     (:inventoryStatus = 'AVAILABLE' AND COALESCE(v.total_inventory, 0) > 5))",
            nativeQuery = true)
    Page<ProductProjection> searchProductsAdmin(
            @Param("id") Long id,
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("status") String status,
            @Param("inventoryStatus") String inventoryStatus, // Đã đổi đồng bộ thành String inventoryStatus
            Pageable pageable
    );

    @Query(value = "SELECT EXISTS(SELECT 1 FROM categories WHERE id = :id)", nativeQuery = true)
    boolean existsCategoryById(@Param("id") Long id);

    // 2. TRUY VẤN CHI TIẾT 1 SẢN PHẨM THEO ID (TỐI ƯU SIÊU TỐC)
    @Query(value = "SELECT " +
            "    p.id AS id, " +
            "    p.name AS name, " +
            "    p.base_price AS price, " +
            "    c.name AS categoryName, " +
            "    p.category_id AS categoryId, " +
            "    pi.image_url AS imageUrl, " +
            "    p.description AS description, " +
            "    COALESCE(v.total_inventory, 0) AS totalInventory, " +
            "    COALESCE(r.avg_rating, 5.0) AS rating, " +
            "    COALESCE(r.comment_count, 0) AS commentCount, " +
            "    0 AS viewCount, " +
            "    p.status AS status, " +
            "    p.sold_count AS soldCount " +
            "FROM products p " +
            "INNER JOIN categories c ON p.category_id = c.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
            "LEFT JOIN (" +
            "    SELECT product_id, CAST(SUM(inventory) AS INTEGER) AS total_inventory " +
            "    FROM product_variants " +
            "    GROUP BY product_id" +
            ") v ON p.id = v.product_id " +
            "LEFT JOIN (" +
            "    SELECT product_id, " +
            "           CAST(AVG(rating) AS FLOAT) AS avg_rating, " +
            "           CAST(COUNT(id) AS INTEGER) AS comment_count " +
            "    FROM reviews " +
            "    GROUP BY product_id" +
            ") r ON p.id = r.product_id " +
            "WHERE p.id = :id",
            nativeQuery = true)
    ProductProjection findProductDetailRawById(@Param("id") Long id);
}