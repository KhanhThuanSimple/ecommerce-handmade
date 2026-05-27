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
            const orderId = searchParams.get('vnp_TxnRef');
            const queryString = searchParams.toString();

            if (!orderId || !queryString) {
                notify.error("Không tìm thấy mã đơn hàng từ VNPay");
                navigate('/profile');
                return;
            }

            try {
                // Backend xác thực chữ ký VNPay + cập nhật đơn + trừ kho/giỏ
                const res = await api.get(`/vnpay/return?${queryString}`);
                const result = res.data;

                if (result.success && result.signatureValid) {
                    await refreshCart();
                    notify.success("Thanh toán VNPay thành công!");
                } else if (!result.signatureValid) {
                    notify.error("Giao dịch không hợp lệ (chữ ký VNPay sai).");
                } else {
                    notify.error("Thanh toán không thành công. Bạn có thể thử lại.");
                }
            } catch (error) {
                console.error("Lỗi xử lý VNPay:", error);
                notify.error("Có lỗi xảy ra khi xác nhận thanh toán");
            } finally {
                setTimeout(() => {
                    navigate('/profile');
                }, 1500);
            }
        };

        void handleResult();
    }, []);

    return (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Đang xác nhận giao dịch...</h3>
            <p>Vui lòng không tắt trình duyệt</p>
        </div>
    );
};

export default VNPayReturn;
