    import React, { useState, useEffect } from 'react';
    import { useNavigate, useLocation } from 'react-router-dom';
    import api from '../services/api';
    import { getProducts } from '../services/ProductService';
    import { User } from '../types/model';
    import { useCart } from '../context/CartContext';
    import { filterVouchersForUser } from '../untils/voucherUtils'; // Hãy đảm bảo file này tồn tại
    import { generateVNPayUrl } from '../services/vnpayService';
    import DeliveryInfo from './DeliveryInfo';
    import '../Styles/checkout.css';
    import { useNotify } from '../components/NotificationContext';


    interface CheckoutProps { currentUser: User | null; }

    const Checkout: React.FC<CheckoutProps> = ({ currentUser }) => {
        const navigate = useNavigate();
        const location = useLocation();
        const { refreshCart } = useCart();
    const notify = useNotify();
        const [shippingDetails, setShippingDetails] = useState<any>(null);
        const [displayItems, setDisplayItems] = useState<any[]>([]);
        const [finalTotal, setFinalTotal] = useState(0);
        const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
        const [loading, setLoading] = useState(true);
        const [formErrors, setFormErrors] = useState<any>({});

        const [vouchers, setVouchers] = useState<any[]>([]);
        const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
        const [discount, setDiscount] = useState(0);

        const buyNowItem = location.state?.buyNowItem;
        const selectedIds = location.state?.selectedIds || [];
        const rePayOrder = location.state?.rePayOrder;

        const payableTotal = Math.max(finalTotal - discount, 0);

        // 1. Validation logic
        const validateCheckout = () => {
            const errors: any = {};
            if (!shippingDetails?.fullName?.trim()) errors.fullName = 'Vui lòng nhập họ tên';
            if (!shippingDetails?.phone?.trim()) {
                errors.phone = 'Vui lòng nhập số điện thoại';
            } else if (!/^(0|\+84)\d{9}$/.test(shippingDetails.phone)) {
                errors.phone = 'Số điện thoại không hợp lệ';
            }
            if (!shippingDetails?.detailAddress || !shippingDetails?.province) {
                errors.address = 'Vui lòng nhập đầy đủ địa chỉ';
            }
            setFormErrors(errors);
            return Object.keys(errors).length === 0;
        };

        // 2. Load Checkout Data
        useEffect(() => {
            if (!currentUser) { navigate('/login'); return; }

            const loadCheckoutData = async () => {
                setLoading(true);
                try {
                    if (rePayOrder) {
                        setDisplayItems(rePayOrder.items);
                        setFinalTotal(rePayOrder.totalAmount);
                        setPaymentMethod(rePayOrder.paymentMethod.toLowerCase() === 'vnpay' ? 'vnpay' : 'cod');
                    } else if (buyNowItem?.id) {
                        setDisplayItems([{ product: buyNowItem, quantity: 1 }]);
                        setFinalTotal(Number(buyNowItem.price));
                    } else if (selectedIds.length > 0) {
                        const [allProducts, cartRes] = await Promise.all([getProducts(), api.get(`/carts?userId=${currentUser.id}`)]);
                        const cartItems = cartRes.data || [];
                        const itemsToPay = cartItems
                            .filter((item: any) => selectedIds.includes(item.productId))
                            .map((item: any) => ({
                                product: allProducts.find((p: any) => p.id === item.productId),
                                quantity: item.quantity
                            }))
                            .filter((i: any) => i.product);
                        if (itemsToPay.length > 0) {
                            setDisplayItems(itemsToPay);
                            setFinalTotal(itemsToPay.reduce((sum: number, i: any) => sum + (i.product.price * i.quantity), 0));
                        } else {
                            navigate('/cart');
                        }
                    } else { navigate('/home'); }
                } catch (err) { console.error(err); } finally { setLoading(false); }
            };
            loadCheckoutData();
        }, [currentUser, buyNowItem, selectedIds.length, rePayOrder]);

        // 3. Load & Filter Vouchers
        useEffect(() => {
            const loadVouchers = async () => {
                if (!currentUser || finalTotal <= 0) return;
                try {
                    const [vouchersRes, ordersRes] = await Promise.all([
                        api.get('/voucher'),
                        api.get(`/orders?userId=${currentUser.id}`)
                    ]);
                    const filtered = filterVouchersForUser(vouchersRes.data, ordersRes.data, finalTotal);
                    setVouchers(filtered);

                    // Kiểm tra voucher đã chọn còn hợp lệ không nếu tổng tiền thay đổi
                    if (selectedVoucher && !filtered.some(v => v.id === selectedVoucher.id)) {
                        setSelectedVoucher(null);
                        setDiscount(0);
                    }
                } catch (err) { console.error("Lỗi tải voucher:", err); }
            };
            loadVouchers();
        }, [finalTotal, currentUser?.id]);

        // 4. Voucher Actions
        const applyVoucher = (voucher: any) => {
            if (selectedVoucher?.id === voucher.id) {
                setSelectedVoucher(null);
                setDiscount(0);
                return;
            }
            let discountValue = voucher.type === 'PERCENT' 
                ? Math.floor((finalTotal * voucher.value) / 100) 
                : voucher.value;
            
            if (voucher.maxDiscount) discountValue = Math.min(discountValue, voucher.maxDiscount);
            
            setSelectedVoucher(voucher);
            setDiscount(discountValue);
        };

        // 5. Order Actions
        const prepareOrderData = (status: string) => {
            const address = shippingDetails?.isFromOldOrder 
                ? shippingDetails.address 
                : `${shippingDetails?.detailAddress}, ${shippingDetails?.ward}, ${shippingDetails?.district}, ${shippingDetails?.province}`;
            const currentPayable = Math.max(finalTotal - discount, 0);
            const data: any = {
                userId: currentUser?.id,
                fullName: shippingDetails?.fullName || "",
                customerEmail: currentUser?.email || "",
                phone: shippingDetails?.phone || "",
                address: address,
                items: displayItems,
                totalAmount: finalTotal, // Tổng tiền trước khi giảm giá
                discountAmount: discount, // Số tiền giảm
                payableAmount: currentPayable, // Số tiền phải trả
                voucherCode: selectedVoucher?.code || null,
                paymentMethod: paymentMethod.toUpperCase(),
                status: status,
                date: rePayOrder ? rePayOrder.date : new Date().toLocaleString('vi-VN')
            };
            if (rePayOrder) {
                data.id = rePayOrder.id;
            }
            return data;
        };

        const handleConfirmOrder = async () => {
            if (!currentUser) return;
            if (!rePayOrder && !validateCheckout()) return;

            const isVNPay = paymentMethod === 'vnpay';
            const orderData = prepareOrderData(isVNPay ? 'Chờ thanh toán' : 'Thanh toán khi nhận hàng');
            const actualAmountToPay = orderData.payableAmount;

            try {
                setLoading(true);

                let orderRes;
                if (rePayOrder) {
                    orderRes = await api.put(`/orders/${rePayOrder.id}`, orderData);
                } else {
                    orderRes = await api.post('/orders', orderData);
                }

                const orderId = orderRes.data.id;

                if (isVNPay) {
                    const paymentUrl = await generateVNPayUrl(actualAmountToPay, orderId);
                    window.location.href = paymentUrl;
                } else {
                    await refreshCart();
                    notify.success("Đặt hàng thành công!");
                    navigate('/order-history');
                }
            } catch (err) {
                console.error("Lỗi thanh toán:", err);
                notify.warning("Lỗi hệ thống! Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        const cleanCartLocally = async () => {
            try {
                const res = await api.get(`/carts?userId=${currentUser?.id}`);
                if (res.data[0]) {
                    const remaining = res.data[0].items.filter((i: any) => !displayItems.some(di => di.product.id === i.productId));
                    await api.patch(`/carts/${res.data[0].id}`, { items: remaining });
                    await refreshCart();
                }
            } catch (err) { }
        };

        if (loading) return <div className="loading">Đang tải...</div>;

        return (
            <div className="checkout-container">
                <h1>Thanh Toán</h1>
                <div className="checkout-grid">
                    <div className="checkout-left">
                        <div className="checkout-card">
                            <h3>Sản phẩm thanh toán</h3>
                            {displayItems.map((item, idx) => (
                                <div key={idx} className="checkout-product-item">
                                    <img src={item.product?.imageUrl} width={50} alt="" />
                                    <div className="item-detail">
                                        <span>{item.product?.name} (x{item.quantity})</span>
                                        <span className="item-subtotal">₫{(item.product?.price * item.quantity).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="checkout-card" style={{ marginTop: '20px' }}>
                            <h3>Thông tin nhận hàng</h3>
                            <DeliveryInfo 
                                initialData={rePayOrder} 
                                onAddressChange={setShippingDetails} 
                                errors={formErrors} 
                            />
                        </div>
                    </div>

                    <div className="checkout-right">
                        <div className="checkout-card">
                            <h3>Phương thức thanh toán</h3>
                            <div className="payment-methods">
                                <label className={`method-item ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                    <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /> COD
                                </label>
                                <label className={`method-item ${paymentMethod === 'vnpay' ? 'active' : ''}`}>
                                    <input type="radio" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} /> <b>VNPay</b>
                                </label>
                            </div>

                            {vouchers.length > 0 && (
                                <div className="voucher-section">
                                    <h3>🎟 Voucher dành cho bạn</h3>
                                    <div className="voucher-list">
                                        {vouchers.map(v => (
                                            <div 
                                                key={v.id} 
                                                className={`voucher-item ${selectedVoucher?.id === v.id ? 'active' : ''}`}
                                                onClick={() => applyVoucher(v)}
                                            >
                                                <div className="voucher-info">
                                                    <span className="voucher-code">{v.code}</span>
                                                    <span className="voucher-name">{v.title}</span>
                                                </div>
                                                <div className="voucher-value">
                                                    {v.type === 'PERCENT' ? `${v.value}%` : `${(v.value/1000)}k`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="checkout-total">
                                <div className="total-row"><span>Tạm tính:</span><span>{finalTotal.toLocaleString('vi-VN')}₫</span></div>
                                {discount > 0 && <div className="total-row discount"><span>Giảm giá:</span><span>-{discount.toLocaleString('vi-VN')}₫</span></div>}
    <div className="total-row final">
    <span>Tổng thanh toán:</span>
    <span>{Math.max(finalTotal - discount, 0).toLocaleString('vi-VN')}₫</span>
    </div>
                            </div>

                            <div className="checkout-actions">
                                <button className="btn-order-confirm" onClick={handleConfirmOrder}>XÁC NHẬN</button>
                                <button className="btn-order-cancel" onClick={() => navigate('/cart')}>QUAY LẠI</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    export default Checkout;