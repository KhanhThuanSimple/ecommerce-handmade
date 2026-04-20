import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Review, User } from '../types/model';
import { getProductById, getReviewsByProductId, postReview } from '../services/ProductService';
import { useCart } from '../context/CartContext';
import { useNotify } from '../components/NotificationContext';
import api from '../services/api';

export const useProductDetail = (id: string | undefined, currentUser: User | null) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const notify = useNotify();

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [hasPurchased, setHasPurchased] = useState<boolean>(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false); // Kiểm tra đã đánh giá chưa
    const [showReviews, setShowReviews] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const productId = Number(id);
                const [productData, reviewsData] = await Promise.all([
                    getProductById(productId),
                    getReviewsByProductId(productId)
                ]);

                if (productData) {
                    setProduct(productData);
                    setReviews(reviewsData.reverse());
                    
                    // Kiểm tra xem user hiện tại đã có bài đánh giá nào trong danh sách chưa
                    if (currentUser) {
                        const reviewed = reviewsData.some((r: Review) => r.userName === currentUser.username);
                        setAlreadyReviewed(reviewed);
                    }
                } else {
                    setError("Không tìm thấy sản phẩm.");
                }
            } catch (err) {
                setError("Có lỗi xảy ra khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, currentUser]);

    useEffect(() => {
        const checkPurchase = async () => {
            if (!currentUser || !product) {
                setHasPurchased(false);
                return;
            }
            try {
                const res = await api.get(`/orders?userId=${currentUser.id}`);
                const bought = res.data.some((order: any) =>
                    order?.items?.some((item: any) => item?.product?.id === product.id)
                );
                setHasPurchased(bought);
            } catch (err) {
                console.error('Lỗi kiểm tra đơn hàng:', err);
                setHasPurchased(false);
            }
        };
        void checkPurchase();
    }, [currentUser, product]);

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Vui lòng đăng nhập để gửi đánh giá!');
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }
        if (!hasPurchased) {
            alert('Bạn cần mua sản phẩm này trước khi đánh giá.');
            return;
        }
        if (alreadyReviewed) {
            alert('Bạn đã đánh giá sản phẩm này rồi. Mỗi khách hàng chỉ được đánh giá một lần.');
            return;
        }
        if (rating === 0 || !comment.trim()) {
            alert('Vui lòng chọn sao và nhập nội dung.');
            return;
        }

        const addReviewInternal = async () => {
            try {
                const allReviewsRes = await api.get('/reviews');
                const allReviews: Review[] = allReviewsRes.data;
                let nextIdString = "1000";
                if (allReviews.length > 0) {
                    const lastId = allReviews[allReviews.length - 1].id;
                    const nextIdNumber = parseInt(lastId, 16) + 1;
                    nextIdString = nextIdNumber.toString(16);
                }

                const newReview: Review = {
                    id: nextIdString,
                    productId: Number(id),
                    userName: currentUser.username,
                    rating,
                    comment: comment.trim(),
                    createdAt: new Date().toLocaleString('vi-VN', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    }).replace(/, /g, ' '),
                };

                const result = await postReview(newReview);
                if (result) {
                    setReviews(prev => [result, ...prev]);
                    setAlreadyReviewed(true); // Cập nhật trạng thái ngay sau khi gửi thành công
                    notify.success("Cảm ơn bạn đã đánh giá sản phẩm!");
                    setRating(0);
                    setComment('');
                }
            } catch (err) {
                console.error("Lỗi khi thêm đánh giá:", err);
                notify.error("Không thể gửi đánh giá lúc này.");
            }
        };
        addReviewInternal();
    };

    const handleBuyNow = () => {
        if (!product || product.inventory <= 0) {
            notify.error("Sản phẩm hiện đã hết hàng");
            return;
        }
        if (!currentUser) {
            notify.warning("Vui lòng đăng nhập để mua hàng");
            navigate('/login', { state: { from: '/checkout', buyNowItem: product } });
            return;
        }
        navigate('/checkout', { state: { buyNowItem: product } });
    };

    return {
        product, loading, error, reviews,
        rating, setRating,
        hoverRating, setHoverRating,
        comment, setComment,
        hasPurchased,
        alreadyReviewed, // Xuất thêm state này để UI có thể ẩn form đánh giá
        showReviews, setShowReviews,
        handleSubmitReview,
        handleBuyNow,
        addToCart,
        navigate
    };
};