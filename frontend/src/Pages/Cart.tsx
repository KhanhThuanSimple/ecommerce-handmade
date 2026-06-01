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
    
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const userString = localStorage.getItem('user');
    const localUser: User | null = userString ? JSON.parse(userString) : null;
    const activeUser = currentUser || localUser;

    useEffect(() => {
        const loadCartData = async () => {
            try {
                const allProducts = await getProducts();
                setProducts(allProducts);

                if (activeUser) {
                    const cartRes = await api.get(`/carts/${activeUser.id}`);
                    setCartItems(cartRes.data || []);
                } else {
                    const localData = localStorage.getItem('guestCart');
                    if (localData) setCartItems(JSON.parse(localData));
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

    // Xử lý Tăng số lượng (+1)
    const handleIncrease = async (pid: number) => {
        if (activeUser) {
            try {
                await api.post('/carts/add', {
                    userId: activeUser.id,
                    productId: pid,
                    quantity: 1
                });
                const res = await api.get(`/carts/${activeUser.id}`);
                setCartItems(res.data);
                await refreshCart();
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || "Không thể tăng số lượng!";
                notify.error(errorMsg);
            }
        } else {
            const prod = getProductInfo(pid);
            const maxStock = prod?.total_inventory ?? (prod as any).inventory ?? 0;
            const newItems = cartItems.map(i => {
                if (i.productId === pid) {
                    if (i.quantity >= maxStock) {
                        notify.warning(`Sản phẩm này chỉ còn tối đa ${maxStock} chiếc!`);
                        return i;
                    }
                    return { ...i, quantity: i.quantity + 1 };
                }
                return i;
            });
            setCartItems(newItems);
            localStorage.setItem('guestCart', JSON.stringify(newItems));
            await refreshCart();
        }
    };

    // Xử lý Giảm số lượng (-1)
    const handleDecrease = async (pid: number, currentQty: number) => {
        if (currentQty <= 1) return;
        if (activeUser) {
            try {
                await api.post('/carts/add', {
                    userId: activeUser.id,
                    productId: pid,
                    quantity: -1
                });
                const res = await api.get(`/carts/${activeUser.id}`);
                setCartItems(res.data);
                await refreshCart();
            } catch (err) {
                console.error(err);
            }
        } else {
            const newItems = cartItems.map(i => i.productId === pid ? { ...i, quantity: i.quantity - 1 } : i);
            setCartItems(newItems);
            localStorage.setItem('guestCart', JSON.stringify(newItems));
            await refreshCart();
        }
    };

    // Xử lý Xóa hẳn món hàng (DELETE)
    const handleDelete = async (pid: number) => {
        if (window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
            try {
                if (activeUser) {
                    await api.delete(`/carts/remove?userId=${activeUser.id}&productId=${pid}`);
                    const res = await api.get(`/carts/${activeUser.id}`);
                    setCartItems(res.data || []);
                } else {
                    const newItems = cartItems.filter(i => i.productId !== pid);
                    setCartItems(newItems);
                    localStorage.setItem('guestCart', JSON.stringify(newItems));
                }
                setSelectedItemIds(prev => prev.filter(id => id !== pid));
                await refreshCart();
                notify.success("Đã xóa sản phẩm thành công.");
            } catch (err) {
                console.error(err);
                notify.error("Không thể xóa sản phẩm.");
            }
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
        if (!activeUser) {
            notify.warning("Vui lòng đăng nhập để thực hiện mua hàng!");
            navigate('/login', { state: { from: '/checkout', selectedIds: selectedItemIds } });
            return;
        }
        navigate('/checkout', { state: { selectedIds: selectedItemIds } });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Đang tải giỏ hàng của bạn...</p>
            </div>
        );
    }

    return (
        <div className="cart-page-container">
            <h1 className="cart-page-title">Giỏ Hàng</h1>
            
            <div className="cart-header-sticky">
                <div className="cart-column-headers">
                    <div className="col-product">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} disabled={cartItems.length === 0} />
                            <span className="custom-checkbox"></span>
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
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            <svg viewBox="0 0 64 64" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="22" cy="54" r="4" fill="currentColor"/>
                                <circle cx="46" cy="54" r="4" fill="currentColor"/>
                                <path d="M4 10h10l8 32h28l6-22H18" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="empty-cart-text">Giỏ hàng của bạn đang trống.</p>
                        <button className="btn-shop-now" onClick={() => navigate('/')}>Tiếp tục mua sắm</button>
                    </div>
                ) : (
                    cartItems.map((item) => {
                        const p = getProductInfo(item.productId);
                        if (!p) return null;
                        const isItemSelected = selectedItemIds.includes(p.id as number);
                        return (
                            <div key={p.id} className={`cart-item ${isItemSelected ? 'item-selected' : ''}`}>
                                <div className="col-product">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isItemSelected}
                                            onChange={() => setSelectedItemIds(prev => prev.includes(p.id as number) ? prev.filter(id => id !== p.id) : [...prev, p.id as number])}
                                        />
                                        <span className="custom-checkbox"></span>
                                    </label>
                                    <div className="product-info-wrapper" onClick={() => navigate(`/product/${p.id}`)}>
                                        <img src={p.imageUrl} alt={p.name} className="item-image" />
                                        <div className="item-name">{p.name}</div>
                                    </div>
                                </div>
                                <div className="col-category">
                                    <span className="category-tag">{p.category}</span>
                                </div>
                                <div className="col-unit-price">₫{p.price.toLocaleString('vi-VN')}</div>

                                <div className="col-quantity">
                                    <div className="quantity-controls">
                                        <button 
                                            className="qty-btn" 
                                            onClick={() => handleDecrease(p.id as number, item.quantity)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                        <input type="text" className="qty-input" value={item.quantity} readOnly />
                                        <button className="qty-btn" onClick={() => handleIncrease(p.id as number)}>
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="col-amount highlight">₫{(p.price * item.quantity).toLocaleString('vi-VN')}</div>
                                <div className="col-action">
                                    <button className="delete-btn" onClick={() => handleDelete(p.id as number)}>
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        Xóa
                                    </button>
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
                        <span className="custom-checkbox"></span>
                        Chọn Tất Cả ({cartItems.length})
                    </label>
                    <button className="delete-selected-btn" onClick={handleClearSelection} disabled={selectedItemIds.length === 0}>
                        Bỏ chọn các mục ({selectedItemIds.length})
                    </button>
                </div>

                <div className="footer-right">
                    <div className="cart-summary">
                        Tổng thanh toán (<span className="summary-count">{selectedItemIds.length} sản phẩm</span>): <span className="total-price">₫{totalSelectedPrice.toLocaleString('vi-VN')}</span>
                    </div>
                    <button className="checkout-button" disabled={selectedItemIds.length === 0} onClick={handleGoToCheckout}>
                        Mua Hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;