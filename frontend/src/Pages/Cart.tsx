import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getProducts } from '../services/ProductService';
import { User, Product } from '../types/model';
import { useCart } from '../context/CartContext';
import '../Styles/cart.css';
import { useNotify } from '../components/NotificationContext';

interface CartProps {
    currentUser: User | null;
}

const Cart: FC<CartProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const { refreshCart } = useCart();
    const notify = useNotify();
console.log('notify:', notify);
    const [cartItems, setCartItems] = useState<{ productId: number; quantity: number }[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartRecordId, setCartRecordId] = useState<string | number | null>(null);

    useEffect(() => {
        const loadCartData = async () => {
            try {
                const allProducts = await getProducts();
                setProducts(allProducts);

                if (currentUser) {
                    const cartRes = await api.get(`/carts?userId=${currentUser.id}`);
                    if (cartRes.data.length > 0) {
                        setCartItems(cartRes.data[0].items || []);
                        setCartRecordId(cartRes.data[0].id);
                    }
                } else {
                    const localData = localStorage.getItem('guestCart');
                    if (localData) {
                        setCartItems(JSON.parse(localData));
                    }
                }
            } catch (err) {
                console.error("Lỗi tải giỏ hàng:", err);
            } finally {
                setLoading(false);
            }
        };
        void loadCartData();
    }, [currentUser]);

    const getProductInfo = (pid: number) => products.find(p => p.id === pid);

    const updateServer = async (newItems: any[]) => {
        setCartItems(newItems);
        if (currentUser && cartRecordId) {
            try {
                await api.patch(`/carts/${cartRecordId}`, { items: newItems });
                await refreshCart();
            } catch (err) {
                console.error("Lỗi cập nhật server:", err);
            }
        } else if (!currentUser) {
            localStorage.setItem('guestCart', JSON.stringify(newItems));
            await refreshCart();
        }
    };

    const handleIncrease = (pid: number, currentQty: number) => {
        const newItems = cartItems.map(i => i.productId === pid ? { ...i, quantity: currentQty + 1 } : i);
        void updateServer(newItems);
    };

    const handleDecrease = (pid: number, currentQty: number) => {
        if (currentQty <= 1) return;
        const newItems = cartItems.map(i => i.productId === pid ? { ...i, quantity: currentQty - 1 } : i);
        void updateServer(newItems);
    };

    const handleDelete = (pid: number) => {
        if (window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
            const newItems = cartItems.filter(i => i.productId !== pid);
            void updateServer(newItems);
            setSelectedItemIds(prev => prev.filter(id => id !== pid));
        }
    };

    const handleClearSelection = () => setSelectedItemIds([]);

    const isAllSelected = cartItems.length > 0 && selectedItemIds.length === cartItems.length;

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedItemIds([]);
        else setSelectedItemIds(cartItems.map(i => i.productId));
    };

    const totalSelectedPrice = cartItems
        .filter(i => selectedItemIds.includes(i.productId))
        .reduce((sum, i) => {
            const p = getProductInfo(i.productId);
            return sum + (p?.price || 0) * i.quantity;
        }, 0);

    const handleGoToCheckout = () => {
        if (!currentUser) {
                          notify.warning("Vui lòng đăng nhập để thực hiện mua hàng!");

            // Điều hướng sang login và gửi kèm trạng thái để sau khi login xong quay lại đúng Checkout
            navigate('/login', { state: { from: '/checkout', selectedIds: selectedItemIds } });
            return;
        }
        navigate('/checkout', { state: { selectedIds: selectedItemIds } });
    };

    if (loading) return <div className="loading-container">Đang tải...</div>;

    return (
        <div className="cart-page-container">
            <div className="cart-header-sticky">
                <div className="cart-column-headers">
                    <div className="col-product">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} disabled={cartItems.length === 0} />
                            Sản Phẩm
                        </label>
                    </div>
                    <div className="col-category">Danh Mục</div>
                    <div className="col-unit-price">Đơn Giá</div>
                    <div className="col-quantity">Số Lượng</div>
                    <div className="col-amount">Số Tiền</div>
                    <div className="col-action">Thao Tác</div>
                </div>
            </div>

            <div className="cart-items-container">
                {cartItems.length === 0 ? (
                    <div className="empty-cart">Giỏ hàng của bạn đang trống.</div>
                ) : (
                    cartItems.map((item) => {
                        const p = getProductInfo(item.productId);
                        if (!p) return null;
                        return (
                            <div key={p.id} className="cart-item">
                                <div className="col-product">
                                    <input
                                        type="checkbox"
                                        checked={selectedItemIds.includes(p.id as number)}
                                        onChange={() => setSelectedItemIds(prev => prev.includes(p.id as number) ? prev.filter(id => id !== p.id) : [...prev, p.id as number])}
                                    />
                                    <img src={p.imageUrl} alt={p.name} className="item-image" />
                                    <div className="item-name">{p.name}</div>
                                </div>
                                <div className="col-category"><span className="category-tag">{p.category}</span></div>


                                <div className="col-unit-price">₫{p.price.toLocaleString('vi-VN')}</div>

                                <div className="col-quantity">
                                    <div className="quantity-controls">
                                        <button onClick={() => handleDecrease(p.id as number, item.quantity)}>-</button>
                                        <input type="text" value={item.quantity} readOnly />
                                        <button onClick={() => handleIncrease(p.id as number, item.quantity)}>+</button>
                                    </div>
                                </div>


                                <div className="col-amount highlight">₫{(p.price * item.quantity).toLocaleString('vi-VN')}</div>

                                <div className="col-action">
                                    <button className="delete-btn" onClick={() => handleDelete(p.id as number)}>Xóa</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="cart-footer-sticky">
                <div className="footer-left">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                        Chọn Tất Cả ({cartItems.length})
                    </label>
                    <button className="delete-selected-btn" onClick={handleClearSelection} disabled={selectedItemIds.length === 0}>
                        Bỏ chọn tất cả mục đã chọn
                    </button>
                </div>

                <div className="footer-right">
                    <div className="cart-summary">

                        Tổng thanh toán ({selectedItemIds.length} sản phẩm): <span className="total-price">₫{totalSelectedPrice.toLocaleString('vi-VN')}</span>


                    </div>
                    <button
                        className="checkout-button"
                        disabled={selectedItemIds.length === 0}
                        onClick={handleGoToCheckout}
                    >
                        Mua Hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;