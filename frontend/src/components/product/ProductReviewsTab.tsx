import React, { useState, useEffect, useCallback } from 'react';
import '../../Styles/productReviewsTab.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatingDist { [star: number]: number }

interface Statistics {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: RatingDist;
}

interface ReviewItem {
    id: number;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
    avatar?: string;
}

interface ReviewsPage {
    content: ReviewItem[];
    totalPages: number;
    totalElements: number;
    page: number;
    size: number;
}

interface ProductReviewsResponse {
    statistics: Statistics;
    reviews: ReviewsPage;
}

interface Props {
    productId: string | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const ProductReviewsTab: React.FC<Props> = ({ productId }) => {
    const [data, setData] = useState<ProductReviewsResponse | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/reviews/products/${productId}?page=${page}&size=${PAGE_SIZE}`
            );
            if (res.ok) {
                const json: ProductReviewsResponse = await res.json();
                setData(json);
            } else {
                // sản phẩm chưa có review — OK
                setData(null);
            }
        } catch (err) {
            console.error('Fetch reviews error:', err);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [productId, page]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // ── helpers ───────────────────────────────────────────────────────────────

    const renderStars = (n: number) => (
        <span className="prt-stars" aria-label={`${n} sao`}>
            {'★'.repeat(Math.min(5, Math.max(0, n)))}
            {'☆'.repeat(5 - Math.min(5, Math.max(0, n)))}
        </span>
    );

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('vi-VN'); }
        catch { return ''; }
    };

    const stats = data?.statistics;
    const reviews = data?.reviews?.content ?? [];
    const totalPages = data?.reviews?.totalPages ?? 1;
    const totalElements = data?.reviews?.totalElements ?? 0;

    // ── render ────────────────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <div className="prt-loading">
                <span className="prt-spinner" />
                <span>Đang tải đánh giá...</span>
            </div>
        );
    }

    return (
        <div className="prt-wrap">

            {/* ── Statistics panel ── */}
            {stats && stats.totalReviews > 0 ? (
                <div className="prt-stats">
                    {/* Score */}
                    <div className="prt-score-box">
                        <span className="prt-score-num">
                            {stats.averageRating.toFixed(1)}
                        </span>
                        <span className="prt-score-den">/5</span>
                        <div className="prt-score-stars">
                            {renderStars(Math.round(stats.averageRating))}
                        </div>
                        <p className="prt-score-total">{stats.totalReviews} đánh giá</p>
                    </div>

                    {/* Distribution bars */}
                    <div className="prt-dist">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = stats.ratingDistribution?.[star] ?? 0;
                            const pct = stats.totalReviews > 0
                                ? (count / stats.totalReviews) * 100 : 0;
                            return (
                                <div key={star} className="prt-dist-row">
                                    <span className="prt-dist-label">{star} ★</span>
                                    <div
                                        className="prt-dist-bar"
                                        role="progressbar"
                                        aria-valuenow={pct}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${star} sao: ${count}`}
                                    >
                                        <div
                                            className="prt-dist-fill"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="prt-dist-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="prt-empty">
                        <i className="fa-regular fa-comment-dots prt-empty-icon" />
                        <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                        <small>Hãy là người đầu tiên chia sẻ trải nghiệm!</small>
                    </div>
                )
            )}

            {/* ── Review list ── */}
            {reviews.length > 0 && (
                <div className="prt-list">
                    <div className="prt-list-header">
                        <h4 className="prt-list-title">Tất cả đánh giá</h4>
                        {totalElements > 0 && (
                            <span className="prt-total-badge">{totalElements}</span>
                        )}
                    </div>

                    {reviews.map(r => (
                        <div key={r.id} className="prt-review-card">
                            <div className="prt-review-top">
                                {/* Avatar */}
                                {r.avatar ? (
                                    <img src={r.avatar} alt={r.userName} className="prt-avatar" />
                                ) : (
                                    <div className="prt-avatar-initial" aria-hidden="true">
                                        {r.userName?.charAt(0).toUpperCase() ?? 'K'}
                                    </div>
                                )}

                                {/* User + stars */}
                                <div className="prt-user-block">
                                    <strong className="prt-username">{r.userName}</strong>
                                    <div className="prt-review-stars">{renderStars(r.rating)}</div>
                                </div>

                                {/* Date */}
                                <time className="prt-review-date" dateTime={r.createdAt}>
                                    {formatDate(r.createdAt)}
                                </time>
                            </div>

                            <p className="prt-review-comment">{r.comment}</p>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="prt-pagination" role="navigation" aria-label="Phân trang">
                            <button
                                className="prt-page-btn"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                            >
                                ← Trước
                            </button>
                            <span className="prt-page-info">{page + 1} / {totalPages}</span>
                            <button
                                className="prt-page-btn"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || loading}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductReviewsTab;
