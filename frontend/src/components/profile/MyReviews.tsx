import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/model';
import '../../Styles/myReviews.css';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PendingItem {
    orderItemId: number;
    productId: number;
    productName: string;
    productImageUrl: string | null;
    orderId: string;
    orderDate: string | null;
    price: number;
    quantity: number;
}

interface CompletedItem {
    reviewId: number;
    orderItemId: number | null;
    productId: number;
    productName: string | null;
    productImageUrl: string | null;
    orderId: string | null;
    rating: number;
    comment: string;
    reviewDate: string | null;
}

interface PagedData<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

interface MyReviewsProps {
    currentUser: User;
}

const PAGE_SIZE = 5;

// ─── Token helper ───────────────────────────────────────────────────────────

function getAuthToken(): string {
    const raw = localStorage.getItem('authHeader');
    if (raw) return raw;
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user?.token || user?.accessToken || user?.jwt || '';
        return token ? `Bearer ${token}` : '';
    } catch {
        return '';
    }
}

// ─── StarSelector ───────────────────────────────────────────────────────────

const StarSelector: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);
    const labels = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời!'];
    return (
        <div>
            <div className="mr-stars-input">
                {[1, 2, 3, 4, 5].map(s => (
                    <button
                        key={s}
                        type="button"
                        className={`mr-star-btn ${s <= (hover || value) ? 'active' : ''}`}
                        onClick={() => onChange(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${s} sao`}
                    >★</button>
                ))}
            </div>
            <p className="mr-star-label">{labels[hover || value]}</p>
        </div>
    );
};

// ─── Pagination bar ─────────────────────────────────────────────────────────

interface PaginationProps {
    page: number;
    totalPages: number;
    totalElements: number;
    loading: boolean;
    onChange: (p: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalElements, loading, onChange }) => {
    if (totalPages <= 1) return null;

    // Tạo danh sách trang hiển thị (window ±2)
    const pages: (number | '...')[] = [];
    const WINDOW = 2;
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= WINDOW) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div className="mr-pagination">
            <span className="mr-pg-info">
                {totalElements} mục · Trang {page + 1}/{totalPages}
            </span>
            <div className="mr-pg-controls">
                <button
                    className="mr-pg-btn"
                    onClick={() => onChange(0)}
                    disabled={page === 0 || loading}
                    aria-label="Trang đầu"
                >«</button>
                <button
                    className="mr-pg-btn"
                    onClick={() => onChange(page - 1)}
                    disabled={page === 0 || loading}
                    aria-label="Trang trước"
                >‹</button>

                {pages.map((p, idx) =>
                    p === '...'
                        ? <span key={`ellipsis-${idx}`} className="mr-pg-ellipsis">…</span>
                        : <button
                            key={p}
                            className={`mr-pg-btn ${p === page ? 'active' : ''}`}
                            onClick={() => onChange(p as number)}
                            disabled={loading}
                            aria-current={p === page ? 'page' : undefined}
                          >{(p as number) + 1}</button>
                )}

                <button
                    className="mr-pg-btn"
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                    aria-label="Trang sau"
                >›</button>
                <button
                    className="mr-pg-btn"
                    onClick={() => onChange(totalPages - 1)}
                    disabled={page >= totalPages - 1 || loading}
                    aria-label="Trang cuối"
                >»</button>
            </div>
        </div>
    );
};

// ─── Main ───────────────────────────────────────────────────────────────────

const MyReviews: React.FC<MyReviewsProps> = ({ currentUser }) => {
    const [tab, setTab] = useState<'pending' | 'completed'>('pending');

    // Separate page state per tab
    const [pendingPage, setPendingPage] = useState(0);
    const [completedPage, setCompletedPage] = useState(0);

    const [pendingData, setPendingData] = useState<PagedData<PendingItem> | null>(null);
    const [completedData, setCompletedData] = useState<PagedData<CompletedItem> | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // modal
    const [modal, setModal] = useState<PendingItem | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');
    const [submitErr, setSubmitErr] = useState('');

    // ── fetch ───────────────────────────────────────────────────────────────

    const fetchPending = useCallback(async (p: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `/api/reviews/users/${currentUser.id}/pending?page=${p}&size=${PAGE_SIZE}`,
                { headers: { Authorization: getAuthToken() } }
            );
            if (!res.ok) {
                setError(res.status === 401 ? 'Phiên đăng nhập hết hạn.' : `Lỗi ${res.status}`);
                return;
            }
            setPendingData(await res.json());
        } catch {
            setError('Không thể kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    const fetchCompleted = useCallback(async (p: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `/api/reviews/users/${currentUser.id}/completed?page=${p}&size=${PAGE_SIZE}`,
                { headers: { Authorization: getAuthToken() } }
            );
            if (!res.ok) {
                setError(res.status === 401 ? 'Phiên đăng nhập hết hạn.' : `Lỗi ${res.status}`);
                return;
            }
            setCompletedData(await res.json());
        } catch {
            setError('Không thể kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    }, [currentUser.id]);

    // Fetch khi đổi tab hoặc đổi trang
    useEffect(() => {
        if (tab === 'pending') fetchPending(pendingPage);
        else fetchCompleted(completedPage);
    }, [tab, pendingPage, completedPage, fetchPending, fetchCompleted]);

    // ── tab switch: reset page ───────────────────────────────────────────────

    const switchTab = (t: 'pending' | 'completed') => {
        if (t === tab) return;
        setTab(t);
        setError('');
    };

    // ── page change ─────────────────────────────────────────────────────────

    const handlePendingPage = (p: number) => setPendingPage(p);
    const handleCompletedPage = (p: number) => setCompletedPage(p);

    // ── modal ────────────────────────────────────────────────────────────────

    const openModal = (item: PendingItem) => {
        setModal(item);
        setRating(5);
        setComment('');
        setSubmitMsg('');
        setSubmitErr('');
    };
    const closeModal = () => setModal(null);

    const handleSubmit = async () => {
        if (!modal) return;
        if (!comment.trim()) { setSubmitErr('Vui lòng nhập nội dung đánh giá.'); return; }
        setSubmitting(true);
        setSubmitErr('');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: getAuthToken() },
                body: JSON.stringify({
                    orderItemId: modal.orderItemId,
                    orderId: modal.orderId,
                    productId: modal.productId,
                    userId: currentUser.id,
                    rating,
                    comment: comment.trim(),
                }),
            });
            if (res.ok) {
                setSubmitMsg('Đánh giá của bạn đã được gửi!');
                setTimeout(() => {
                    closeModal();
                    // Refresh pending ở trang hiện tại, reset completed về trang 0
                    setCompletedPage(0);
                    fetchPending(pendingPage);
                }, 1000);
            } else {
                const txt = await res.text();
                let msg = 'Có lỗi khi gửi đánh giá.';
                try { msg = JSON.parse(txt)?.message || msg; } catch { msg = txt || msg; }
                setSubmitErr(msg);
            }
        } catch {
            setSubmitErr('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── render helpers ───────────────────────────────────────────────────────

    const stars = (n: number) => (
        <span className="mr-stars-display">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
    );

    const fmtDate = (iso: string | null) => {
        if (!iso) return '';
        try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return ''; }
    };

    const pendingTotal = pendingData?.totalElements ?? 0;
    const completedTotal = completedData?.totalElements ?? 0;

    // ── render ───────────────────────────────────────────────────────────────

    return (
        <div className="mr-wrap">

            {/* Tab bar */}
            <div className="mr-tabbar" role="tablist">
                <button role="tab" aria-selected={tab === 'pending'}
                    className={`mr-tab ${tab === 'pending' ? 'active' : ''}`}
                    onClick={() => switchTab('pending')}>
                    <i className="fa-regular fa-clock" />
                    Chưa đánh giá
                    {pendingTotal > 0 && <span className="mr-badge">{pendingTotal}</span>}
                </button>
                <button role="tab" aria-selected={tab === 'completed'}
                    className={`mr-tab ${tab === 'completed' ? 'active' : ''}`}
                    onClick={() => switchTab('completed')}>
                    <i className="fa-solid fa-star" />
                    Đã đánh giá
                    {completedTotal > 0 && <span className="mr-badge done">{completedTotal}</span>}
                </button>
            </div>

            {/* Body */}
            {error && (
                <div className="mr-error-msg">
                    <i className="fa-solid fa-triangle-exclamation" /> {error}
                </div>
            )}

            {!error && (
                <>
                    {/* ── PENDING ─────────────────────────────────────── */}
                    {tab === 'pending' && (
                        <>
                            {loading ? (
                                <div className="mr-loading"><span className="mr-spinner" /><span>Đang tải...</span></div>
                            ) : !pendingData || pendingData.content.length === 0 ? (
                                <div className="mr-empty">
                                    <i className="fa-solid fa-circle-check mr-empty-icon success" />
                                    <p>Bạn đã đánh giá tất cả sản phẩm đã mua.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mr-list">
                                        {pendingData.content.map(item => (
                                            <div key={item.orderItemId} className="mr-card">
                                                <img
                                                    src={item.productImageUrl || '/placeholder.png'}
                                                    alt={item.productName}
                                                    className="mr-thumb"
                                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                                                />
                                                <div className="mr-card-info">
                                                    <p className="mr-product-name">{item.productName}</p>
                                                    <p className="mr-meta">
                                                        <i className="fa-solid fa-receipt" />
                                                        &nbsp;Đơn #{item.orderId}
                                                        {item.orderDate && <> · {fmtDate(item.orderDate)}</>}
                                                    </p>
                                                    <p className="mr-meta">
                                                        {item.price?.toLocaleString('vi-VN')}đ × {item.quantity}
                                                    </p>
                                                </div>
                                                <button className="mr-btn-write" onClick={() => openModal(item)}>
                                                    <i className="fa-solid fa-pen-to-square" /> Đánh giá
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={pendingPage}
                                        totalPages={pendingData.totalPages}
                                        totalElements={pendingData.totalElements}
                                        loading={loading}
                                        onChange={handlePendingPage}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {/* ── COMPLETED ───────────────────────────────────── */}
                    {tab === 'completed' && (
                        <>
                            {loading ? (
                                <div className="mr-loading"><span className="mr-spinner" /><span>Đang tải...</span></div>
                            ) : !completedData || completedData.content.length === 0 ? (
                                <div className="mr-empty">
                                    <i className="fa-regular fa-star mr-empty-icon" />
                                    <p>Bạn chưa gửi đánh giá nào.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mr-list">
                                        {completedData.content.map(item => (
                                            <div key={item.reviewId} className="mr-card reviewed">
                                                <img
                                                    src={item.productImageUrl || '/placeholder.png'}
                                                    alt={item.productName || 'Sản phẩm'}
                                                    className="mr-thumb"
                                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                                                />
                                                <div className="mr-card-info">
                                                    <p className="mr-product-name">
                                                        {item.productName || `Sản phẩm #${item.productId}`}
                                                    </p>
                                                    {item.orderId && (
                                                        <p className="mr-meta">
                                                            <i className="fa-solid fa-receipt" />&nbsp;Đơn #{item.orderId}
                                                        </p>
                                                    )}
                                                    <div className="mr-review-bubble">
                                                        {stars(item.rating)}
                                                        <p className="mr-comment-text">{item.comment}</p>
                                                        {item.reviewDate && (
                                                            <p className="mr-review-date">{fmtDate(item.reviewDate)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="mr-done-badge">
                                                    <i className="fa-solid fa-circle-check" /> Đã đánh giá
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        page={completedPage}
                                        totalPages={completedData.totalPages}
                                        totalElements={completedData.totalElements}
                                        loading={loading}
                                        onChange={handleCompletedPage}
                                    />
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── Modal ─────────────────────────────────────────────── */}
            {modal && (
                <div
                    className="mr-overlay"
                    role="dialog" aria-modal="true" aria-labelledby="mr-modal-title"
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="mr-modal">
                        <div className="mr-modal-head">
                            <h3 id="mr-modal-title" className="mr-modal-title">Viết đánh giá</h3>
                            <button className="mr-close-btn" onClick={closeModal} aria-label="Đóng">✕</button>
                        </div>

                        <div className="mr-modal-product">
                            <img
                                src={modal.productImageUrl || '/placeholder.png'}
                                alt={modal.productName}
                                className="mr-modal-thumb"
                                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                            />
                            <div>
                                <p className="mr-modal-pname">{modal.productName}</p>
                                <p className="mr-meta">Đơn #{modal.orderId}</p>
                            </div>
                        </div>

                        <div className="mr-field">
                            <label className="mr-label">Chất lượng sản phẩm</label>
                            <StarSelector value={rating} onChange={setRating} />
                        </div>

                        <div className="mr-field">
                            <label className="mr-label" htmlFor="mr-comment">Nội dung đánh giá</label>
                            <textarea
                                id="mr-comment"
                                className="mr-textarea"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                rows={4}
                            />
                        </div>

                        {submitErr && <p className="mr-field-error">{submitErr}</p>}
                        {submitMsg && <p className="mr-field-success">{submitMsg}</p>}

                        <div className="mr-modal-actions">
                            <button className="mr-btn-cancel" onClick={closeModal} disabled={submitting}>
                                Trở lại
                            </button>
                            <button className="mr-btn-submit" onClick={handleSubmit} disabled={submitting}>
                                {submitting
                                    ? <><span className="mr-spinner-sm" /> Đang gửi...</>
                                    : <><i className="fa-solid fa-paper-plane" /> Gửi đánh giá</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReviews;
