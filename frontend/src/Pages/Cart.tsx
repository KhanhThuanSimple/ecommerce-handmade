import React, { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getProducts } from '../services/ProductService';
import { User, Product } from '../types/model';
import { useCart } from '../context/CartContext';
import { useNotify } from '../components/NotificationContext';
import '../Styles/cart.css';

// ── Types ──────────────────────────────────────────────────
interface CartItemRow {
    productId: number;
    quantity: number;
    maxInventory?: number;
}

interface CartProps {
    currentUser: User | null;
}

// ── Helpers ────────────────────────────────────────────────
/** Đọc active user từ prop hoặc localStorage */
const getActiveUser = (currentUser: User | null): User | null => {
    if (currentUser) return currentUser;
    const raw = localStorage.getItem('user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

/** Gộp các rows trùng productId thành 1 (tổng quantity) */
const deduplicateItems = (items: CartItemRow[]): CartItemRow[] => {
    const map = new Map<number, CartItemRow>();
    for (const item of items) {
        const pid = Number(item.productId);
        if (map.has(pid)) {
            map.get(pid)!.quantity += item.quantity;
        } else {
            map.set(pid, { ...item, productId: pid });
        }
    }
    return Array.from(map.values());
};

// ── Component ──────────────────────────────────────────────
const Cart: FC<CartProps> = ({ currentUser }) => {
    const navigate            = useNavigate();
    const { refreshCart }     = useCart();
    const notify              = useNotify();

    const [cartItems, setCartItems]       = useState<CartItemRow[]>([]);
    const [products, setProducts]         = useState<Product[]>([]);
    const [selectedIds, setSelectedIds]   = useState<number[]>([]);
    const [loading, setLoading]           = useState(true);
    const [busyItems, setBusyItems]       = useState<Set<number>>(new Set());

    const activeUser = getActiveUser(currentUser);

    // ── Load cart ────────────────────────────────────────────
    const loadCart = useCallback(async () => {
        setLoading(true);
        try {
            const allProducts = await getProducts();
            setProducts(allProducts);

            if (activeUser) {
                const res = await api.get<CartItemRow[]>(`/carts/${activeUser.id}`);
                const raw = Array.isArray(res?.data) ? res.data : [];
                setCartItems(deduplicateItems(raw));
            } else {
                const raw = localStorage.getItem('guestCart');
                const parsed: CartItemRow[] = raw ? JSON.parse(raw) : [];
                const deduped = deduplicateItems(parsed);
                setCartItems(deduped);
                localStorage.setItem('guestCart', JSON.stringify(deduped));
            }
        } catch (err) {
            console.error('Lỗi tải giỏ hàng:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { void loadCart(); }, [loadCart]);

    // ── Lấy thông tin product ────────────────────────────────
    const getProduct = (pid: number) => products.find(p => Number(p.id) === pid);

    // ── Cập nhật state local + localStorage (guest) ──────────
    const updateLocalItems = (items: CartItemRow[]) => {
        setCartItems(items);
        if (!activeUser) localStorage.setItem('guestCart', JSON.stringify(items));
    };

    // ── setBusy helper ───────────────────────────────────────
    const setBusy = (pid: number, busy: boolean) =>
        setBusyItems(prev => { const s = new Set(prev); busy ? s.add(pid) : s.delete(pid); return s; });

    // ── Tăng số lượng ────────────────────────────────────────
    const handleIncrease = async (pid: number) => {
        if (busyItems.has(pid)) return;
        setBusy(pid, true);
        try {
            const item = cartItems.find(i => i.productId === pid);
            const prod = getProduct(pid);
            const maxStock = item?.maxInventory ?? prod?.inventory ?? (prod as any)?.total_inventory ?? 0;

            if (item && item.quantity >= maxStock) {
                notify.warning(`Sản phẩm chỉ còn ${maxStock} chiếc!`);
                return;
            }

            if (activeUser) {
                await api.post('/carts/add', { userId: Number(activeUser.id), productId: pid, quantity: 1 });
                const res = await api.get<CartItemRow[]>(`/carts/${activeUser.id}`);
                setCartItems(deduplicateItems(Array.isArray(res?.data) ? res.data : []));
            } else {
                updateLocalItems(cartItems.map(i => i.productId === pid ? { ...i, quantity: i.quantity + 1 } : i));
            }
            await refreshCart();
        } catch (err: any) {
            notify.error(err.response?.data?.message ?? 'Không thể tăng số lượng!');
        } finally {
            setBusy(pid, false);
        }
    };

    // ── Giảm số lượng ────────────────────────────────────────
    const handleDecrease = async (pid: number, currentQty: number) => {
        if (currentQty <= 1 || busyItems.has(pid)) return;
        setBusy(pid, true);
        try {
            if (activeUser) {
                await api.post('/carts/add', { userId: Number(activeUser.id), productId: pid, quantity: -1 });
                const res = await api.get<CartItemRow[]>(`/carts/${activeUser.id}`);
                setCartItems(deduplicateItems(Array.isArray(res?.data) ? res.data : []));
            } else {
                updateLocalItems(cartItems.map(i => i.productId === pid ? { ...i, quantity: i.quantity - 1 } : i));
            }
            await refreshCart();
        } catch (err) {
            console.error(err);
        } finally {
            setBusy(pid, false);
        }
    };

    // ── Xóa sản phẩm ─────────────────────────────────────────
    const handleDelete = async (pid: number) => {
        if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            if (activeUser) {
                await api.delete(`/carts/remove?userId=${activeUser.id}&productId=${pid}`);
                const res = await api.get<CartItemRow[]>(`/carts/${activeUser.id}`);
                setCartItems(deduplicateItems(Array.isArray(res?.data) ? res.data : []));
            } else {
                updateLocalItems(cartItems.filter(i => i.productId !== pid));
            }
            setSelectedIds(prev => prev.filter(id => id !== pid));
            await refreshCart();
            notify.success('Đã xóa sản phẩm.');
        } catch {
            notify.error('Không thể xóa sản phẩm.');
        }
    };

    // ── Select / Checkout ────────────────────────────────────
    const isAllSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

    const toggleSelectAll = () =>
        setSelectedIds(isAllSelected ? [] : cartItems.map(i => i.productId));

    const toggleItem = (pid: number) =>
        setSelectedIds(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);

    const totalSelectedPrice = cartItems
        .filter(i => selectedIds.includes(i.productId))
        .reduce((sum, i) => {
            const p = getProduct(i.productId);
            return sum + (p?.price ?? 0) * i.quantity;
        }, 0);

    const handleCheckout = () => {
        if (!activeUser) {
            notify.warning('Vui lòng đăng nhập để mua hàng!');
            navigate('/login', { state: { from: '/checkout', selectedIds } });
            return;
        }
        navigate('/checkout', { state: { selectedIds } });
    };

    // ── Render ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Đang tải giỏ hàng...</p>
            </div>
        );
    }

    return (
        <div className="cart-page-container">
            <h1 className="cart-page-title">Giỏ Hàng</h1>

            {/* ── Column headers ── */}
            <div className="cart-header-sticky">
                <div className="cart-column-headers">
                    <div className="col-product">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                disabled={cartItems.length === 0}
                            />
                            <span className="custom-checkbox" />
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

            {/* ── Items list ── */}
            <div className="cart-items-container">
                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            <svg viewBox="0 0 64 64" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="22" cy="54" r="4" fill="currentColor" />
                                <circle cx="46" cy="54" r="4" fill="currentColor" />
                                <path d="M4 10h10l8 32h28l6-22H18" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="empty-cart-text">Giỏ hàng của bạn đang trống.</p>
                        <button className="btn-shop-now" onClick={() => navigate('/products')}>
                            Tiếp tục mua sắm
                        </button>
                    </div>
                ) : (
                    cartItems.map(item => {
                        const p = getProduct(item.productId);
                        if (!p) return null;

                        const isSelected = selectedIds.includes(item.productId);
                        const maxStock   = item.maxInventory ?? p.inventory ?? (p as any).total_inventory ?? 0;
                        const isBusy     = busyItems.has(item.productId);

                        return (
                            // key dùng productId (đã deduplicate, luôn unique)
                            <div
                                key={item.productId}
                                className={`cart-item${isSelected ? ' item-selected' : ''}`}
                            >
                                {/* ── Checkbox + Tên ── */}
                                <div className="col-product">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleItem(item.productId)}
                                        />
                                        <span className="custom-checkbox" />
                                    </label>
                                    <div
                                        className="product-info-wrapper"
                                        onClick={() => navigate(`/products/${p.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={p.imageUrl} alt={p.name} className="item-image" />
                                        <div className="item-name">{p.name}</div>
                                    </div>
                                </div>

                                {/* ── Danh mục ── */}
                                <div className="col-category">
                                    <span className="category-tag">{p.category}</span>
                                </div>

                                {/* ── Đơn giá ── */}
                                <div className="col-unit-price">
                                    {p.price.toLocaleString('vi-VN')} VNĐ
                                </div>

                                {/* ── Số lượng ── */}
                                <div className="col-quantity">
                                    <div className="quantity-controls">
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleDecrease(item.productId, item.quantity)}
                                            disabled={item.quantity <= 1 || isBusy}
                                        >
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>
                                        <input className="qty-input" value={item.quantity} readOnly />
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleIncrease(item.productId)}
                                            disabled={item.quantity >= maxStock || isBusy}
                                        >
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5"  y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* ── Tổng tiền ── */}
                                <div className="col-amount highlight">
                                    {(p.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                                </div>

                                {/* ── Xóa ── */}
                                <div className="col-action">
                                    <button className="delete-btn" onClick={() => handleDelete(item.productId)}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Footer / Checkout ── */}
            <div className="cart-footer-sticky">
                <div className="footer-left">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                        <span className="custom-checkbox" />
                        Chọn Tất Cả ({cartItems.length})
                    </label>
                    <button
                        className="delete-selected-btn"
                        onClick={() => setSelectedIds([])}
                        disabled={selectedIds.length === 0}
                    >
                        Bỏ chọn ({selectedIds.length})
                    </button>
                </div>

                <div className="footer-right">
                    <div className="cart-summary">
                        Tổng thanh toán&nbsp;
                        (<span className="summary-count">{selectedIds.length} sản phẩm</span>):&nbsp;
                        <span className="total-price">{totalSelectedPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <button
                        className="checkout-button"
                        disabled={selectedIds.length === 0}
                        onClick={handleCheckout}
                    >
                        Mua Hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
