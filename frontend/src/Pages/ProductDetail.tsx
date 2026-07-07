import React from 'react';
import { useParams } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import ProductPolicy from '../components/ProductPolicy';
import { User } from '../types/model';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../Styles/productDetail.css';
import ImageMagnifier from "../components/ImangeMagnifier";
import ProductReviewsTab from '../components/product/ProductReviewsTab';

interface ProductDetailProps {
    currentUser: User | null;
    onLogout: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ currentUser }) => {
    const { id } = useParams<{ id: string }>();
    
    // Lấy nguyên xi các biến và hàm từ hook ra để dùng cho giao diện bên dưới
    const {
        product, loading, error, 
        handleBuyNow,
        addToCart,
        navigate
    } = useProductDetail(id, currentUser);

    const [activeTab, setActiveTab] = React.useState<'desc' | 'specs' | 'reviews'>('desc');

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
                            onClick={() => addToCart(product)}
                            disabled={product.inventory === 0}
                        >
                            Thêm vào giỏ
                        </button>
                    </div>
                </div>
            </div>

            {/* BÊN DƯỚI: TABS */}
            <div className="pd-tabs-section">
                <div className="pd-tabs-header" role="tablist">
                    {([ 
                        { key: 'desc',    label: 'Mô tả sản phẩm' },
                        { key: 'specs',   label: 'Thông số kỹ thuật' },
                        { key: 'reviews', label: '⭐ Đánh giá' },
                    ] as const).map(({ key, label }) => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={activeTab === key}
                            className={`pd-tab-btn ${activeTab === key ? 'active' : ''}`}
                            onClick={() => setActiveTab(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="pd-tab-body">
                    {activeTab === 'desc' && (
                        <div className="pd-desc-content">{product.description}</div>
                    )}
                    {activeTab === 'specs' && (
                        <p className="pd-specs-placeholder">Đang cập nhật thông số...</p>
                    )}
                    {activeTab === 'reviews' && (
                        <ProductReviewsTab productId={id} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;