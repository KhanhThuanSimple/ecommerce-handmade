package com.handmade.handmade_api.modules.reviews.controller;

import com.handmade.handmade_api.modules.reviews.dto.*;
import com.handmade.handmade_api.modules.reviews.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * GET /api/reviews/products/{productId}?page=0&size=5
     * Trả về statistics + paginated reviews cho ProductDetail tab.
     */
    @GetMapping("/products/{productId}")
    public ResponseEntity<ProductReviewsPageDTO> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        ProductReviewsPageDTO response = reviewService.getProductReviews(productId, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/reviews/can-review?userId=X&productId=Y
     */
    @GetMapping("/can-review")
    public ResponseEntity<Map<String, Boolean>> canReview(
            @RequestParam Long userId,
            @RequestParam Long productId) {
        boolean allowed = reviewService.canUserReview(userId, productId);
        return ResponseEntity.ok(Map.of("canReview", allowed));
    }

    /**
     * GET /api/reviews/users/{userId}/pending?page=0&size=5
     * Danh sách sản phẩm đã mua (đơn hoàn thành) CHƯA đánh giá — có phân trang.
     */
    @GetMapping("/users/{userId}/pending")
    public ResponseEntity<PagedResponse<PendingReviewItemDTO>> getPendingReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(reviewService.getPendingReviews(userId, page, size));
    }

    /**
     * GET /api/reviews/users/{userId}/completed?page=0&size=5
     * Danh sách review ĐÃ gửi của user — có phân trang.
     */
    @GetMapping("/users/{userId}/completed")
    public ResponseEntity<PagedResponse<CompletedReviewItemDTO>> getCompletedReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(reviewService.getCompletedReviews(userId, page, size));
    }

    /**
     * POST /api/reviews
     * Gửi đánh giá mới.
     */
    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(
            @RequestBody ReviewRequest reviewRequest) {
        ReviewResponse response = reviewService.createReview(reviewRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
