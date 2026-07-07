package com.handmade.handmade_api.modules.reviews.service;

import com.handmade.handmade_api.modules.orders.entity.OrderItem;
import com.handmade.handmade_api.modules.orders.repository.OrderItemRepository;
import com.handmade.handmade_api.modules.reviews.dto.*;
import com.handmade.handmade_api.modules.reviews.entity.ReviewEntity;
import com.handmade.handmade_api.modules.reviews.repository.ReviewRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final DateTimeFormatter ISO_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public ReviewService(ReviewRepository reviewRepository,
                         OrderItemRepository orderItemRepository) {
        this.reviewRepository = reviewRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // ── GET: Paginated reviews + statistics cho ProductDetail ─────────────────

    public ProductReviewsPageDTO getProductReviews(Long productId, int page, int size) {
        // 1. Tính statistics từ tất cả reviews (không phân trang)
        List<Object[]> distRows = reviewRepository.countRatingDistributionByProductId(productId);
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);

        long total = 0;
        double sum = 0;
        for (Object[] row : distRows) {
            int rating = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            distribution.put(rating, count);
            total += count;
            sum += (double) rating * count;
        }
        double avg = total > 0 ? Math.round((sum / total) * 10.0) / 10.0 : 0.0;

        ProductReviewsPageDTO.Statistics stats =
                new ProductReviewsPageDTO.Statistics(total, avg, distribution);

        // 2. Lấy reviews phân trang
        Page<ReviewResponse> reviewPage = reviewRepository
                .findPagedReviewsByProductId(productId, PageRequest.of(page, size));

        ProductReviewsPageDTO.ReviewsPage reviewsPage =
                new ProductReviewsPageDTO.ReviewsPage(
                        reviewPage.getContent(),
                        reviewPage.getTotalPages(),
                        reviewPage.getTotalElements(),
                        page, size
                );

        return new ProductReviewsPageDTO(stats, reviewsPage);
    }

    // ── GET: Legacy flat list (vẫn giữ để backward-compat) ───────────────────

    @Cacheable(value = "reviews", key = "#productId")
    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        return reviewRepository.findReviewsByProductId(productId);
    }

    // ── GET: canReview check ──────────────────────────────────────────────────

    public boolean canUserReview(Long userId, Long productId) {
        if (userId == null || productId == null) return false;
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) return false;
        return orderItemRepository.existsPurchasedProduct(userId, productId);
    }

    // ── GET: Sản phẩm chưa đánh giá (theo từng order_item) ───────────────────

    @Transactional(readOnly = true)
    public PagedResponse<PendingReviewItemDTO> getPendingReviews(Long userId, int page, int size) {
        // Lấy tất cả order_items từ đơn đã hoàn thành của user
        List<OrderItem> completedItems = orderItemRepository.findCompletedOrderItemsByUserId(userId);

        // Filter: bỏ những item đã có review
        List<PendingReviewItemDTO> allPending = new ArrayList<>();
        for (OrderItem oi : completedItems) {
            if (reviewRepository.existsByOrderItemId(oi.getId())) continue;

            PendingReviewItemDTO dto = new PendingReviewItemDTO();
            dto.setOrderItemId(oi.getId());
            dto.setProductId(oi.getProductId());
            dto.setProductName(oi.getProductName());
            dto.setOrderId(oi.getOrder().getId());
            dto.setOrderDate(oi.getOrder().getCreatedAt() != null
                    ? oi.getOrder().getCreatedAt().format(ISO_FMT) : null);
            dto.setPrice(oi.getProductPrice());
            dto.setQuantity(oi.getQuantity());
            dto.setProductImageUrl(getFeaturedImageUrl(oi.getProductId()));
            allPending.add(dto);
        }

        return paginate(allPending, page, size);
    }

    // ── GET: Sản phẩm đã đánh giá ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<CompletedReviewItemDTO> getCompletedReviews(Long userId, int page, int size) {
        List<ReviewEntity> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<CompletedReviewItemDTO> allCompleted = new ArrayList<>();
        for (ReviewEntity r : reviews) {
            CompletedReviewItemDTO dto = new CompletedReviewItemDTO();
            dto.setReviewId(r.getId());
            dto.setProductId(r.getProductId());
            dto.setOrderId(r.getOrderId());
            dto.setRating(r.getRating());
            dto.setComment(r.getComment());
            dto.setReviewDate(r.getCreatedAt() != null
                    ? r.getCreatedAt().format(ISO_FMT) : null);

            if (r.getOrderItemId() != null) {
                orderItemRepository.findById(r.getOrderItemId()).ifPresent(oi -> {
                    dto.setOrderItemId(oi.getId());
                    dto.setProductName(oi.getProductName());
                    dto.setProductImageUrl(getFeaturedImageUrl(oi.getProductId()));
                });
            }
            if (dto.getProductImageUrl() == null) {
                dto.setProductImageUrl(getFeaturedImageUrl(r.getProductId()));
            }
            allCompleted.add(dto);
        }

        return paginate(allCompleted, page, size);
    }

    // ── POST: Submit review ───────────────────────────────────────────────────

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "reviews", key = "#request.productId"),
            @CacheEvict(value = "products", key = "#request.productId"),
            @CacheEvict(value = "products", key = "'all'")
    })
    public ReviewResponse createReview(ReviewRequest request) {
        if (request.getUserId() == null || request.getProductId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu userId hoặc productId");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đánh giá phải từ 1 đến 5 sao");
        }

        // Nếu có orderItemId → kiểm tra theo đơn (mua nhiều lần = đánh giá nhiều lần)
        if (request.getOrderItemId() != null) {
            if (reviewRepository.existsByOrderItemId(request.getOrderItemId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Bạn đã đánh giá sản phẩm này trong đơn hàng đó rồi");
            }
            // Xác minh order_item thuộc về user
            OrderItem oi = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Không tìm thấy order item"));
            if (!oi.getOrder().getUserId().equals(request.getUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Đơn hàng không thuộc về bạn");
            }
        } else {
            // Fallback legacy: chỉ cho review 1 lần per sản phẩm
            if (!orderItemRepository.existsPurchasedProduct(request.getUserId(), request.getProductId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Bạn cần mua sản phẩm này trước khi đánh giá");
            }
            if (reviewRepository.existsByUserIdAndProductId(request.getUserId(), request.getProductId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Bạn đã đánh giá sản phẩm này rồi");
            }
        }

        ReviewEntity entity = new ReviewEntity();
        entity.setProductId(request.getProductId());
        entity.setUserId(request.getUserId());
        entity.setOrderItemId(request.getOrderItemId());
        entity.setOrderId(request.getOrderId());
        entity.setRating(request.getRating());
        entity.setComment(request.getComment());

        ReviewEntity saved = reviewRepository.save(entity);
        return reviewRepository.findReviewResponseById(saved.getId());
    }

    // ── Helper: Lấy featured image URL của sản phẩm ──────────────────────────

    @SuppressWarnings("unchecked")
    private String getFeaturedImageUrl(Long productId) {
        if (productId == null) return null;
        try {
            List<String> rows = entityManager.createNativeQuery(
                    "SELECT image_url FROM product_images " +
                    "WHERE product_id = ?1 AND is_featured = TRUE LIMIT 1")
                    .setParameter(1, productId)
                    .getResultList();
            if (!rows.isEmpty()) return rows.get(0);

            // Fallback: bất kỳ ảnh nào
            rows = entityManager.createNativeQuery(
                    "SELECT image_url FROM product_images WHERE product_id = ?1 LIMIT 1")
                    .setParameter(1, productId)
                    .getResultList();
            return rows.isEmpty() ? null : rows.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    // ── Helper: Slice list thành page ─────────────────────────────────────────

    private <T> PagedResponse<T> paginate(List<T> all, int page, int size) {
        int safeSize  = Math.max(1, size);
        int safePage  = Math.max(0, page);
        long total    = all.size();
        int totalPages = (int) Math.ceil((double) total / safeSize);

        int from = safePage * safeSize;
        int to   = Math.min(from + safeSize, (int) total);

        List<T> content = (from >= total) ? List.of() : all.subList(from, to);
        return new PagedResponse<>(content, safePage, safeSize, total, Math.max(1, totalPages));
    }
}
