package com.handmade.handmade_api.modules.reviews.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.handmade.handmade_api.modules.reviews.dto.ReviewRequest;
import com.handmade.handmade_api.modules.reviews.dto.ReviewResponse;
import com.handmade.handmade_api.modules.reviews.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
// Sử dụng originPatterns để linh hoạt và an toàn tuyệt đối với Spring Security khi allowCredentials = true
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // 1. API Lấy danh sách Review theo Product ID
    // Khớp URL FE gọi: /reviews/products/{productId}
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getReviewsByProductId(@PathVariable("productId") Long productId) {
        
        // Đã sửa thành getReviewsByProductId để khớp chuẩn xác với hàm trong ReviewService
        List<ReviewResponse> reviews = reviewService.getReviewsByProductId(productId);
        
        // Giữ đúng logic: Nếu không có review, trả về 404 để kích hoạt catch(reviewErr) của FE 
        // giúp đồng bộ setReviews([]) và setAlreadyReviewed(false).
        if (reviews == null || reviews.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Chưa có lượt đánh giá nào.");
        }
        
        return ResponseEntity.ok(reviews);
    }

    // 2. API Lưu bài Review mới
    // Khớp URL FE gọi: /reviews
    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(@RequestBody ReviewRequest reviewRequest) {
        ReviewResponse response = reviewService.createReview(reviewRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}