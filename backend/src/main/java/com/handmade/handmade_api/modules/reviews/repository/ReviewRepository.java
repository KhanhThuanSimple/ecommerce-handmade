package com.handmade.handmade_api.modules.reviews.repository;

import com.handmade.handmade_api.modules.reviews.dto.ReviewResponse;
import com.handmade.handmade_api.modules.reviews.entity.ReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    // ── Lấy tất cả review của 1 sản phẩm (dùng khi tính statistics) ──────────
    @Query("SELECT new com.handmade.handmade_api.modules.reviews.dto.ReviewResponse(" +
           "r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
           "FROM ReviewEntity r " +
           "JOIN com.handmade.handmade_api.modules.auth.entity.User u ON r.userId = u.id " +
           "WHERE r.productId = :productId " +
           "ORDER BY r.createdAt DESC")
    List<ReviewResponse> findReviewsByProductId(@Param("productId") Long productId);

    // ── Phân trang reviews của 1 sản phẩm ────────────────────────────────────
    @Query(value =
           "SELECT new com.handmade.handmade_api.modules.reviews.dto.ReviewResponse(" +
           "r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
           "FROM ReviewEntity r " +
           "JOIN com.handmade.handmade_api.modules.auth.entity.User u ON r.userId = u.id " +
           "WHERE r.productId = :productId " +
           "ORDER BY r.createdAt DESC",
           countQuery =
           "SELECT COUNT(r) FROM ReviewEntity r WHERE r.productId = :productId")
    Page<ReviewResponse> findPagedReviewsByProductId(@Param("productId") Long productId, Pageable pageable);

    // ── Lấy 1 review theo ID ──────────────────────────────────────────────────
    @Query("SELECT new com.handmade.handmade_api.modules.reviews.dto.ReviewResponse(" +
           "r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
           "FROM ReviewEntity r " +
           "JOIN com.handmade.handmade_api.modules.auth.entity.User u ON r.userId = u.id " +
           "WHERE r.id = :reviewId")
    ReviewResponse findReviewResponseById(@Param("reviewId") Long reviewId);

    // ── Tất cả review của 1 user ──────────────────────────────────────────────
    List<ReviewEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ── Kiểm tra đã review theo orderItemId ───────────────────────────────────
    boolean existsByOrderItemId(Long orderItemId);

    // ── Kiểm tra đã review theo userId + productId (legacy) ───────────────────
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    // ── Tìm review theo orderItemId ───────────────────────────────────────────
    ReviewEntity findByOrderItemId(Long orderItemId);

    // ── Thống kê phân phối rating của 1 sản phẩm ─────────────────────────────
    @Query("SELECT r.rating, COUNT(r) FROM ReviewEntity r " +
           "WHERE r.productId = :productId GROUP BY r.rating")
    List<Object[]> countRatingDistributionByProductId(@Param("productId") Long productId);
}
