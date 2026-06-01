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
                // ĐÃ SỬA: Sửa lại đường dẫn chuẩn khớp với @RequestMapping("/api/payment") của Backend
                const res = await api.get(`/payment/vnpay/return?${queryString}`);
                const result = res.data;

                if (result.success && result.signatureValid) {
                    await refreshCart();
                    notify.success("Thanh toán VNPay thành công!");
                } else if (!result.signatureValid) {
                    notify.error("Giao dịch không hợp lệ (Chữ ký xác thực thất bại).");
                } else {
                    notify.error("Thanh toán không thành công hoặc đã bị hủy.");
                }
            } catch (error) {
                console.error("Lỗi kết nối API VNPay:", error);
                notify.error("Có lỗi xảy ra khi xác nhận thanh toán với máy chủ");
            } finally {
                setTimeout(() => {
                    navigate('/profile');
                }, 1500);
            }
        };

        void handleResult();
    }, [searchParams, navigate, refreshCart, notify]);

    return (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Đang xác nhận giao dịch với hệ thống...</h3>
            <p>Vui lòng không đóng hoặc làm mới trình duyệt</p>
        </div>
    );
};

export default VNPayReturn;