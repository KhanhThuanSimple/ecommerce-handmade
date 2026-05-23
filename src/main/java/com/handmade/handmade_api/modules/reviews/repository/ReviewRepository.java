package com.handmade.handmade_api.modules.reviews.repository;

import com.handmade.handmade_api.modules.reviews.dto.ReviewResponse;
import com.handmade.handmade_api.modules.reviews.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    // Lấy u.fullName (Tên đầy đủ) hoặc u.email làm tên hiển thị trên giao diện đánh giá
    @Query("SELECT new com.handmade.handmade_api.modules.reviews.dto.ReviewResponse(r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
           "FROM ReviewEntity r JOIN User u ON r.userId = u.id " +
           "WHERE r.productId = :productId")
    List<ReviewResponse> findReviewsByProductId(@Param("productId") Long productId);
    
    @Query("SELECT new com.handmade.handmade_api.modules.reviews.dto.ReviewResponse(r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
           "FROM ReviewEntity r JOIN User u ON r.userId = u.id " +
           "WHERE r.id = :reviewId")
    ReviewResponse findReviewResponseById(@Param("reviewId") Long reviewId);
}