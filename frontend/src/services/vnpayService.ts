import api from './api';

/**
 * Tạo URL thanh toán VNPay qua backend (HMAC SHA512 chuẩn VNPay).
 * Không ký phía FE — tránh lỗi checksum khi sang trang VNPay.
 */
export const generateVNPayUrl = async (amount: number, orderId: string): Promise<string> => {
    const res = await api.post('/vnpay/create-url', { orderId, amount });
    return res.data.paymentUrl;
};
