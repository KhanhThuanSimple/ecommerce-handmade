import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Review, User } from '../types/model';
import { useCart } from '../context/CartContext';
import { useNotify } from '../components/NotificationContext';
import api from '../services/api'; // Đảm bảo axios instance đã cấu hình baseURL là http://localhost:8080

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
    const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false); 
    const [showReviews, setShowReviews] = useState<boolean>(true);

    // 1. Tải thông tin chi tiết sản phẩm và danh sách đánh giá từ Backend
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const productId = Number(id);
                
                // Gọi đồng thời API lấy chi tiết sản phẩm và API lấy review của Spring Boot
                const [productRes, reviewsRes] = await Promise.all([
                    api.get<Product>(`/api/products/${productId}`),
                    api.get<Review[]>(`/api/reviews/product/${productId}`)
                ]);

                if (productRes.data) {
                    setProduct(productRes.data);
                    // Mới nhất xếp lên đầu
                    setReviews(reviewsRes.data.reverse());
                    
                    // Kiểm tra xem tài khoản này đã từng đánh giá sản phẩm này chưa
                    if (currentUser) {
                        const reviewed = reviewsRes.data.some((r: Review) => r.userName === currentUser.username);
                        setAlreadyReviewed(reviewed);
                    }
                } else {
                    setError("Không tìm thấy sản phẩm.");
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu API:", err);
                setError("Có lỗi xảy ra khi tải dữ liệu từ hệ thống.");
            } finally {
                setLoading(false);
            }
        };
        void fetchData();
    }, [id, currentUser]);

    // 2. Kiểm tra xem người dùng hiện tại đã mua sản phẩm này chưa (Để kích hoạt quyền đánh giá)
    useEffect(() => {
        const checkPurchase = async () => {
            if (!currentUser || !product) {
                setHasPurchased(false);
                return;
            }
            try {
                // Gọi API lịch sử đơn hàng của Spring Boot Backend
                const res = await api.get(`/api/orders/user/${currentUser.id}`);
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

    // 3. Xử lý gửi đánh giá mới lên Backend Spring Boot
    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentUser) {
            notify.warning('Vui lòng đăng nhập để gửi đánh giá!');
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }
        if (!hasPurchased) {
            notify.error('Bạn cần hoàn tất mua sản phẩm này trước khi gửi đánh giá.');
            return;
        }
        if (alreadyReviewed) {
            notify.error('Mỗi khách hàng chỉ được để lại đánh giá một lần duy nhất.');
            return;
        }
        if (rating === 0 || !comment.trim()) {
            notify.warning('Vui lòng chọn số sao và nhập nội dung bình luận.');
            return;
        }

        const addReviewInternal = async () => {
            try {
                // Đóng gói dữ liệu dạng DTO tối giản phù hợp với cấu trúc Entity Reviews của Spring Boot
                const reviewPayload = {
                    productId: Number(id),
                    userId: currentUser.id, // Backend sẽ dùng khóa ngoại liên kết bảng users
                    rating: rating,
                    comment: comment.trim()
                };

                // Thực hiện gửi POST lên Spring Boot
                const response = await api.post<Review>('/api/reviews', reviewPayload);
                
                if (response.data) {
                    setReviews(prev => [response.data, ...prev]);
                    setAlreadyReviewed(true); 
                    notify.success("Cảm ơn bạn đã đóng góp đánh giá sản phẩm!");
                    setRating(0);
                    setComment('');
                }
            } catch (err) {
                console.error("Lỗi gửi bài đánh giá:", err);
                notify.error("Hệ thống không thể lưu nhận xét của bạn lúc này.");
            }
        };
        void addReviewInternal();
    };

    // 4. Chức năng Mua Ngay
    const handleBuyNow = () => {
        if (!product || product.inventory <= 0) {
            notify.error("Sản phẩm hiện đã hết hàng trong kho.");
            return;
        }
        if (!currentUser) {
            notify.warning("Vui lòng đăng nhập tài khoản để mua hàng");
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
        alreadyReviewed, 
        showReviews, setShowReviews,
        handleSubmitReview,
        handleBuyNow,
        addToCart,
        navigate
    };
};