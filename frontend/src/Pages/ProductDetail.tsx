import React from 'react';
import { useParams } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import ProductPolicy from '../components/ProductPolicy';
import { User } from '../types/model';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../Styles/productDetail.css';
import ImageMagnifier from "../components/ImangeMagnifier";

interface ProductDetailProps {
    currentUser: User | null;
    onLogout: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ currentUser }) => {
    const { id } = useParams<{ id: string }>();
    
    // Lấy nguyên xi các biến và hàm từ hook ra để dùng cho giao diện bên dưới
    const {
        product, loading, error, reviews,
        rating, setRating,
        hoverRating, setHoverRating,
        comment, setComment,
        hasPurchased,
        showReviews, setShowReviews,
        handleSubmitReview,
        handleBuyNow,
        addToCart,
        navigate
    } = useProductDetail(id, currentUser);

    if (loading) return <div className="loading-spinner">Đang tải...</div>;
    
    if (error || !product) return (
        <div className="error-container" style={{ textAlign: 'center', marginTop: '50px' }}>
            <p>{error || "Sản phẩm không tồn tại!"}</p>
            <button onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
    );

    return (
        <div className="product-page-container">
            <div className="product-detail">
                {/* BÊN TRÁI: ẢNH */}
                <div className="product-detail-image-wrapper">
                    <ImageMagnifier src={product.imageUrl} alt={product.name} />
                </div>
                {/* BÊN PHẢI: THÔNG TIN */}
                <div className="product-detail-info">
                    <h2 className="product-title">{product.name}</h2>
                    <p className="product-price">{product.price.toLocaleString('vi-VN')} VNĐ</p>

                    <ProductPolicy />

                    <div className="product-meta">
                        <p><strong>Danh mục:</strong> {product.category}</p>
                        <p><strong>Tình trạng:</strong> 
                            <span style={{ color: product.inventory > 0 ? '#27ae60' : '#e74c3c' }}>
                                {product.inventory > 0 ? ' Còn hàng' : ' Hết hàng'}
                            </span>
                        </p>
                    </div>

                    <div className="product-description">{product.description}</div>
                    
                    <div className="product-actions">
                        <button 
                            className="btn-buy-now" 
                            onClick={handleBuyNow} 
                            disabled={product.inventory === 0}
                        >
                            Mua ngay
                        </button>
                        <button 
                            className="btn-add-cart" 
                            onClick={() => addToCart(product, currentUser)}
                            disabled={product.inventory === 0}
                        >
                            Thêm vào giỏ
                        </button>
                    </div>
                </div>
            </div>

            {/* BÊN DƯỚI: ĐÁNH GIÁ */}
            <div className="product-review-section">
                <div className="review-toggle-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Đánh giá sản phẩm:</h3>
                    <button 
                        onClick={() => setShowReviews(!showReviews)}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #007bff',
                            background: 'white',
                            color: '#007bff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {showReviews ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                    </button>
                </div>
                
                {showReviews && (
                    <>
                        {currentUser ? (
                            hasPurchased ? (
                            <form className="review-form" onSubmit={handleSubmitReview}>
                                <div className="review-stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={(hoverRating || rating) >= star ? 'star-button active' : 'star-button'}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            <i className="fas fa-star"></i>
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="review-textarea"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Cảm nhận của bạn về sản phẩm này..."
                                />
                                <button type="submit" className="btn-primary">Gửi đánh giá</button>
                            </form>
                            ) : (
                                <div className="review-login-hint">
                                    Bạn cần mua sản phẩm này trước khi đánh giá.{' '}
                                    <button className="btn-primary" onClick={() => navigate('/orders')}>
                                        Xem đơn hàng
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="review-login-hint">
                                Vui lòng <strong style={{cursor:'pointer', color:'#007bff'}} onClick={() => navigate('/login')}>đăng nhập</strong> để bình luận.
                            </div>
                        )}

                        <div className="review-list">
                            {reviews.length === 0 ? (
                                <p style={{color: '#888', fontStyle: 'italic'}}>Chưa có đánh giá nào cho sản phẩm này.</p>
                            ) : (
                                reviews.map(r => (
                                    <div key={r.id} className="review-item">
                                        <div className="review-header">
                                            <span className="review-user">
                                                <i className="fas fa-user-circle"></i> {r.userName}
                                            </span>
                                            <span className="review-rating">
                                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                            </span>
                                        </div>
                                        <p className="review-comment">{r.comment}</p>
                                        <span className="review-date">{r.createdAt}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;