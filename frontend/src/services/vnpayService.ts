import api from './api';

export interface PaymentPayload {
    orderId: string;
    amount: number;
    paymentMethod: string; // Sẽ truyền vào chữ hoa: 'VNPAY', 'MOMO'...
}

/**
 * Hàm gọi cổng thanh toán tích hợp động kết nối với Spring Boot Strategy.
 * Trỏ thẳng về endpoint /api/payment/process đã dựng ở Backend.
 */
export const processOnlinePayment = async (payload: PaymentPayload): Promise<string> => {
    const res = await api.post('/payment/process', payload);
    return res.data.paymentUrl; // Trả về chuỗi URL từ Backend để thực hiện redirect
};