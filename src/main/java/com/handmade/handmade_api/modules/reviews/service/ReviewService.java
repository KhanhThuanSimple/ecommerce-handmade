package com.handmade.handmade_api.modules.reviews.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.handmade.handmade_api.modules.reviews.dto.ReviewRequest;
import com.handmade.handmade_api.modules.reviews.dto.ReviewResponse;
import com.handmade.handmade_api.modules.reviews.entity.ReviewEntity;
import com.handmade.handmade_api.modules.reviews.repository.ReviewRepository;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    // Đã đổi tên hàm thành getReviewsByProductId để khớp 100% với cách gọi ở ReviewController
    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        List<ReviewResponse> reviews = reviewRepository.findReviewsByProductId(productId);
        
        // FE có dòng code: if (reviewErr.response?.status === 404) để catch mảng rỗng
        // Nếu muốn chuẩn chỉnh, khi danh sách rỗng ta có thể ném ngoại lệ 404 hoặc trả về danh sách trống tùy cấu hình.
        // Tuy nhiên trả về danh sách trống (mảng rỗng) thường an toàn hơn.
        return reviews;
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        ReviewEntity entity = new ReviewEntity();
        entity.setProductId(request.getProductId());
        entity.setUserId(request.getUserId());
        entity.setRating(request.getRating());
        entity.setComment(request.getComment());
        
        // Lưu xuống DB
        ReviewEntity saved = reviewRepository.save(entity);
        
        // Lấy ngược thông tin kèm theo userName để FE push trực tiếp vào state reviews ở Client
        return reviewRepository.findReviewResponseById(saved.getId());
    }
}