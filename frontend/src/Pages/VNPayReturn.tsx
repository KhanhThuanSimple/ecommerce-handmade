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
    const isProcessed = useRef(false);

    useEffect(() => {
        if (isProcessed.current) return;
        isProcessed.current = true;

        const handleResult = async () => {
            const orderId     = searchParams.get('vnp_TxnRef');
            const queryString = searchParams.toString();

            if (!orderId || !queryString) {
                notify.error('Không tìm thấy mã đơn hàng từ VNPay');
                navigate('/orders');
                return;
            }

            try {
                // Gọi đúng endpoint backend: /api/payment/vnpay/return
                const res = await api.get(`/payment/vnpay/return?${queryString}`);
                const result = res?.data;

                if (!result) {
                    notify.error('Máy chủ không phản hồi, vui lòng kiểm tra lại đơn hàng.');
                    setTimeout(() => navigate('/orders'), 2000);
                    return;
                }

                if (result.success && result.signatureValid) {
                    await refreshCart();
                    notify.success('Thanh toán VNPay thành công! Đơn hàng đã được xác nhận.');
                    setTimeout(() => navigate(`/order-detail/${orderId}`), 1500);
                } else if (!result.signatureValid) {
                    notify.error('Giao dịch không hợp lệ — chữ ký xác thực thất bại.');
                    setTimeout(() => navigate('/orders'), 2000);
                } else {
                    notify.error('Thanh toán không thành công hoặc đã bị hủy.');
                    setTimeout(() => navigate('/orders'), 2000);
                }
            } catch (error) {
                console.error('Lỗi kết nối API VNPay:', error);
                notify.error('Có lỗi xảy ra khi xác nhận thanh toán.');
                setTimeout(() => navigate('/orders'), 2000);
            }
        };

        void handleResult();
    }, [searchParams, navigate, refreshCart, notify]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
        }}>
            <div style={{ fontSize: '40px' }}>⏳</div>
            <h3 style={{ margin: 0 }}>Đang xác nhận giao dịch...</h3>
            <p style={{ color: '#757575', margin: 0 }}>Vui lòng không đóng hoặc làm mới trình duyệt</p>
        </div>
    );
};

export default VNPayReturn;
