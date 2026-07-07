package com.handmade.handmade_api.modules.reviews.dto;

import java.util.List;
import java.util.Map;

/**
 * Response cho GET /api/reviews/products/{productId}
 * Shape khớp với ProductReviewsTab.tsx:
 *  { statistics: { totalReviews, averageRating, ratingDistribution },
 *    reviews:    { content, totalPages, totalElements } }
 */
public class ProductReviewsPageDTO {

    private Statistics statistics;
    private ReviewsPage reviews;

    public ProductReviewsPageDTO(Statistics statistics, ReviewsPage reviews) {
        this.statistics = statistics;
        this.reviews = reviews;
    }

    public Statistics getStatistics() { return statistics; }
    public ReviewsPage getReviews() { return reviews; }

    // ── Inner: Statistics ────────────────────────────────────────
    public static class Statistics {
        private long totalReviews;
        private double averageRating;
        private Map<Integer, Long> ratingDistribution;

        public Statistics(long totalReviews, double averageRating, Map<Integer, Long> ratingDistribution) {
            this.totalReviews = totalReviews;
            this.averageRating = averageRating;
            this.ratingDistribution = ratingDistribution;
        }

        public long getTotalReviews() { return totalReviews; }
        public double getAverageRating() { return averageRating; }
        public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    }

    // ── Inner: Page ───────────────────────────────────────────────
    public static class ReviewsPage {
        private List<ReviewResponse> content;
        private int totalPages;
        private long totalElements;
        private int page;
        private int size;

        public ReviewsPage(List<ReviewResponse> content, int totalPages, long totalElements, int page, int size) {
            this.content = content;
            this.totalPages = totalPages;
            this.totalElements = totalElements;
            this.page = page;
            this.size = size;
        }

        public List<ReviewResponse> getContent() { return content; }
        public int getTotalPages() { return totalPages; }
        public long getTotalElements() { return totalElements; }
        public int getPage() { return page; }
        public int getSize() { return size; }
    }
}
