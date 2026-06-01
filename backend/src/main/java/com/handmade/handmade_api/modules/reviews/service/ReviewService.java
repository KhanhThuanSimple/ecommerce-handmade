package com.handmade.handmade_api.modules.reviews.service;

import com.handmade.handmade_api.modules.orders.repository.OrderItemRepository;
import com.handmade.handmade_api.modules.reviews.dto.ReviewRequest;
import com.handmade.handmade_api.modules.reviews.dto.ReviewResponse;
import com.handmade.handmade_api.modules.reviews.entity.ReviewEntity;
import com.handmade.handmade_api.modules.reviews.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;

    public ReviewService(ReviewRepository reviewRepository, OrderItemRepository orderItemRepository) {
        this.reviewRepository = reviewRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        return reviewRepository.findReviewsByProductId(productId);
    }

    public boolean canUserReview(Long userId, Long productId) {
        if (userId == null || productId == null) {
            return false;
        }
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            return false;
        }
        return orderItemRepository.existsPurchasedProduct(userId, productId);
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        if (request.getUserId() == null || request.getProductId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu userId hoặc productId");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đánh giá phải từ 1 đến 5 sao");
        }

        if (!orderItemRepository.existsPurchasedProduct(request.getUserId(), request.getProductId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn cần mua sản phẩm này trước khi đánh giá");
        }

        if (reviewRepository.existsByUserIdAndProductId(request.getUserId(), request.getProductId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá sản phẩm này rồi");
        }

        ReviewEntity entity = new ReviewEntity();
        entity.setProductId(request.getProductId());
        entity.setUserId(request.getUserId());
        entity.setRating(request.getRating());
        entity.setComment(request.getComment());

        ReviewEntity saved = reviewRepository.save(entity);
        return reviewRepository.findReviewResponseById(saved.getId());
    }
}
