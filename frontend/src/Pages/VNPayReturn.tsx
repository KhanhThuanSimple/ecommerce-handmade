import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useNotify } from '../components/NotificationContext';

const VNPayReturn: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshCart } = useCart();
    const notify = useNotify();
    const isProcessed = useRef(false); // Tránh StrictMode chạy 2 lần

    useEffect(() => {
        if (isProcessed.current) return;
        isProcessed.current = true;

        const handleResult = async () => {
            const responseCode = searchParams.get('vnp_ResponseCode');
            const orderId = searchParams.get('vnp_TxnRef');

            if (!orderId) {
                notify.error("Không tìm thấy mã đơn hàng");
                navigate('/profile');
                return;
            }

            try {
                const orderRes = await api.get(`/orders/${orderId}`);
                const orderData = orderRes.data;

                if (responseCode === '00') {
                    // ✅ THANH TOÁN THÀNH CÔNG
                    await api.patch(`/orders/${orderId}`, {
                        status: 'Đã thanh toán'
                    });

                    // Trừ giỏ hàng
                    const cartRes = await api.get(`/carts?userId=${orderData.userId}`);
                    const userCart = cartRes.data[0];

                    if (userCart) {
                        const remaining = userCart.items.filter(
                            (i: any) =>
                                !orderData.items.some(
                                    (oi: any) => oi.product.id === i.productId
                                )
                        );

                        await api.patch(`/carts/${userCart.id}`, { items: remaining });
                        await refreshCart();
                    }

                    notify.success("🎉 Thanh toán VNPay thành công!");
                } else {
                    // ❌ THANH TOÁN THẤT BẠI / HỦY
                    await api.patch(`/orders/${orderId}`, {
                        status: 'Thanh toán thất bại'
                    });

                    notify.error("❌ Thanh toán không thành công. Bạn có thể thử lại.");
                }
            } catch (error) {
                console.error("Lỗi xử lý VNPay:", error);
                notify.error("Có lỗi xảy ra khi xác nhận thanh toán");
            } finally {
                // ⏳ Cho người dùng thấy toast trước khi chuyển trang
                setTimeout(() => {
                    navigate('/profile'); // Trang đơn hàng
                }, 1500);
            }
        };

        void handleResult();
    }, []);

    return (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>🔄 Đang xác nhận giao dịch...</h3>
            <p>Vui lòng không tắt trình duyệt</p>
        </div>
    );
};

export default VNPayReturn;
