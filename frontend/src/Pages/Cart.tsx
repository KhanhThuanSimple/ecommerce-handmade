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
                                        <button onClick={() => handleIncrease(p.id as number)}>+</button>
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
                    <button className="checkout-button" disabled={selectedItemIds.length === 0} onClick={handleGoToCheckout}>
                        Mua Hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;