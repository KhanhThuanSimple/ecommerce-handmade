import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Review, User } from '../types/model';
import { useCart } from '../context/CartContext';
import { useNotify } from '../components/NotificationContext';
import api from '../services/api';

export const useProductDetail = (
    id: string | undefined,
    currentUser: User | null
) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const notify = useNotify();

    // =========================
    // STATE
    // =========================
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    const [hasPurchased, setHasPurchased] = useState<boolean>(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false);
    const [showReviews, setShowReviews] = useState<boolean>(true);

    // =========================
    // FETCH PRODUCT + REVIEWS
    // =========================
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                const productId = Number(id);

                // =========================
                // 1. LẤY THÔNG TIN SẢN PHẨM
                // =========================
                const productRes = await api.get<Product>(`/products/${productId}`);

                if (!productRes.data) {
                    setError('Không tìm thấy sản phẩm.');
                    return;
                }
                setProduct(productRes.data);

                // =========================
                // 2. LẤY REVIEW (NẾU CÓ)
                // =========================
                try {
                    const reviewsRes = await api.get<any>(`/reviews/products/${productId}`);
                    
                    // Kiểm tra nếu data trả về là mảng thì xử lý, nếu là String (do 404) thì coi như mảng rỗng
                    const reviewData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

                    // Sắp xếp Review mới nhất lên đầu
                    setReviews([...reviewData].reverse());

                    // Kiểm tra người dùng hiện tại đã viết đánh giá cho sản phẩm này chưa
                    if (currentUser && reviewData.length > 0) {
                        const reviewed = reviewData.some(
                            (r: any) => String(r.userName).toLowerCase() === String(currentUser.username || currentUser.email).toLowerCase()
                        );
                        setAlreadyReviewed(reviewed);
                    } else {
                        setAlreadyReviewed(false);
                    }

                } catch (reviewErr: any) {
                    // Nếu lỗi 404 (chưa có review nào), đưa mảng về rỗng chứ không crash app
                    if (reviewErr.response?.status === 404) {
                        setReviews([]);
                        setAlreadyReviewed(false);
                    } else {
                        // Nếu có dữ liệu trả về dù báo lỗi (do axios nhận diện string), kiểm tra xem có mảng ẩn không
                        if (reviewErr.response?.data && Array.isArray(reviewErr.response.data)) {
                            setReviews([...reviewErr.response.data].reverse());
                        } else {
                            console.error('Lỗi lấy danh sách đánh giá:', reviewErr);
                            setReviews([]);
                        }
                    }
                }

            } catch (err) {
                console.error('Lỗi lấy dữ liệu sản phẩm:', err);
                setError('Có lỗi xảy ra khi tải dữ liệu sản phẩm.');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [id, currentUser]);

    // =========================
    // KIỂM TRA ĐÃ MUA HÀNG CHƯA
    // =========================
    useEffect(() => {
        const checkPurchase = async () => {
            if (!currentUser || !product) {
                setHasPurchased(false);
                return;
            }

            try {
                const res = await api.get(`/orders/user/${currentUser.id}`);
                const bought = res.data.some((order: any) =>
                    order?.items?.some((item: any) => item?.productId === product.id)
                );
                setHasPurchased(bought);
            } catch (err) {
                console.error('Lỗi kiểm tra lịch sử đơn hàng:', err);
                setHasPurchased(false);
            }
        };

        void checkPurchase();
    }, [currentUser, product]);

    // =========================
    // GỬI REVIEW
    // =========================
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            notify.warning('Vui lòng đăng nhập để gửi đánh giá!');
            navigate('/login', { state: { from: `/products/${id}` } });
            return;
        }

        if (!hasPurchased) {
            notify.error('Bạn cần mua sản phẩm trước khi đánh giá.');
            return;
        }

        if (alreadyReviewed) {
            notify.error('Bạn đã đánh giá sản phẩm này rồi.');
            return;
        }

        if (rating === 0 || !comment.trim()) {
            notify.warning('Vui lòng chọn số sao và nhập bình luận.');
            return;
        }

        try {
            const reviewPayload = {
                productId: Number(id),
                userId: currentUser.id,
                rating,
                comment: comment.trim()
            };

            const response = await api.post<Review>('/reviews', reviewPayload);

            if (response.data) {
                setReviews(prev => [response.data, ...prev]);
                setAlreadyReviewed(true);
                notify.success('Cảm ơn bạn đã đánh giá sản phẩm!');
                
                // Reset form
                setRating(0);
                setHoverRating(0);
                setComment('');
            }
        } catch (err) {
            console.error('Lỗi gửi đánh giá:', err);
            notify.error('Không thể gửi đánh giá lúc này.');
        }
    };

    // =========================
    // MUA NGAY
    // =========================
    const handleBuyNow = () => {
        if (!product) return;

        if ((product.inventory ?? 0) <= 0) {
            notify.error('Sản phẩm hiện đã hết hàng.');
            return;
        }

        if (!currentUser) {
            notify.warning('Vui lòng đăng nhập để mua hàng.');
            navigate('/login', {
                state: { from: '/checkout', buyNowItem: product }
            });
            return;
        }

        navigate('/checkout', { state: { buyNowItem: product } });
    };

    return {
        product,
        reviews,
        loading,
        error,
        rating,
        setRating,
        hoverRating,
        setHoverRating,
        comment,
        setComment,
        hasPurchased,
        alreadyReviewed,
        showReviews,
        setShowReviews,
        handleSubmitReview,
        handleBuyNow,
        addToCart,
        navigate
    };
};