import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Product, User } from '../types/model';
import { useNotify } from '../components/NotificationContext';
import '../Styles/product.css';
import api from '../services/api';

interface ProductCardProps {    
    product: Product;
    currentUser: User | null;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [isFavorite, setIsFavorite] = useState(false);
    const notify = useNotify();

    const userString = localStorage.getItem('user');
    const localUser: User | null = userString ? JSON.parse(userString) : null;

    // Đọc lót giá trị tồn kho an toàn chống undefined
    const stock = product.total_inventory !== undefined ? product.total_inventory : (product as any).inventory ?? 0;

    useEffect(() => {
        if (localUser?.wishlist) {
            const exists = localUser.wishlist.some((p: Product) => p.id === product.id);
            setIsFavorite(exists);
        }
    }, [product.id, localUser]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localUser) {
            notify.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích");
            return;
        }

        const currentWishlist = localUser.wishlist || [];
        let updatedWishlist: Product[] = isFavorite
            ? currentWishlist.filter((p: Product) => p.id !== product.id)
            : [...currentWishlist, product];

        try {
            const response = await api.patch(`users/${localUser.id}`, { wishlist: updatedWishlist });
            if (response.status === 200) {
                const updatedUser = { ...localUser, wishlist: updatedWishlist };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setIsFavorite(!isFavorite);
                window.dispatchEvent(new Event('wishlistUpdated'));
                notify.success(isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật wishlist:", error);
            notify.error("Không thể cập nhật yêu thích");
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (stock > 0) {
            void addToCart(product);
        } else {
            notify.error("Sản phẩm đã hết hàng");
        }
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (stock > 0) {
            navigate('/checkout', { state: { buyNowItem: product } });
        } else {
            notify.error("Sản phẩm đã hết hàng");
        }
    };

    return (
        <div className="product-card">
            <div className="product-image" onClick={() => navigate(`/products/${product.id}`)}>
                <img src={product.imageUrl} alt={product.name} />
                <div className={`favorite-icon ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite}>
                    <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} style={{ color: isFavorite ? "#ff4d4d" : "" }}></i>
                </div>
                <div className="add-to-cart-icon" title="Thêm vào giỏ" onClick={handleAddToCart}>
                    <i className="fas fa-shopping-cart"></i>
                </div>
            </div>

            <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">{(product?.price ?? 0).toLocaleString('vi-VN')} VNĐ</p>
                <p className="product-inventory">Còn lại: {stock} sản phẩm</p>

                <div className="product-buttons">
                    <button className="view-button" onClick={() => navigate(`/products/${product.id}`)}>
                        Xem chi tiết
                    </button>
                    <button className="buy-button" onClick={handleBuyNow} disabled={stock <= 0}>
                        Mua ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;