import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types/model';
import '../Styles/orders.css';

interface OrderHistoryProps { currentUser: User | null; }

// ── Mapping trạng thái → badge CSS class ──────────────────
const getStatusBadge = (status: string, method: string): { label: string; cls: string } => {
    const s = (status ?? '').toLowerCase().trim();
    const m = (method ?? '').toUpperCase().trim();

    // Ưu tiên hiển thị Đã thanh toán VNPay cho mọi đơn VNPAY
    if (m === 'VNPAY' || m === 'VN PAY') {
        return { label: 'Đã thanh toán VNPay', cls: 'paid' };
    }

    if (['đã thanh toán', 'paid', 'completed', 'hoàn thành'].includes(s)) {
        return { label: 'Đã thanh toán', cls: 'paid' };
    }

    if (s === 'chờ thanh toán' || s === 'pending')
        return { label: 'Chờ thanh toán', cls: 'pending' };

    if (s === 'thanh toán khi nhận hàng' || s === 'cod')
        return { label: 'Thanh toán COD', cls: 'cod' };

    if (['thanh toán thất bại', 'failed', 'đã hủy'].includes(s))
        return { label: status, cls: 'failed' };

    return { label: status, cls: 'pending' };
};

// ── Component ─────────────────────────────────────────────
const OrderHistory: React.FC<OrderHistoryProps> = ({ currentUser }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;
            try {
                const res = await api.get(`/orders?userId=${currentUser.id}`);
                const data = Array.isArray(res?.data) ? res.data : [];
                // Sắp xếp đơn mới nhất lên đầu
                data.sort((a: any, b: any) => b.id.localeCompare(a.id));
                setOrders(data);
            } catch (err) {
                console.error('Lỗi tải đơn hàng:', err);
            } finally {
                setLoading(false);
            }
        };
        void fetchOrders();
    }, [currentUser]);

    if (loading) return <div className="loading-screen">Đang tải danh sách đơn hàng...</div>;

    return (
        <div className="order-mgmt-wrapper">
            <div className="order-mgmt-header">
                <h2>
                    <i className="fa-solid fa-box-open" /> Lịch Sử Đơn Hàng
                </h2>
                <p>
                    Bạn có tổng cộng <strong>{orders.length}</strong> đơn hàng
                </p>
            </div>

            <div className="table-container">
                <table className="order-dashboard-table">
                    <thead>
                        <tr>
                            <th style={{ width: 50 }}>STT</th>
                            <th>Mã Đơn</th>
                            <th>Ngày Đặt</th>
                            <th>Hình thức</th>
                            <th>Tổng Tiền</th>
                            <th>Trạng Thái</th>
                            <th style={{ textAlign: 'center' }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? orders.map((order, index) => {
                            const badge = getStatusBadge(order.status, order.paymentMethod);
                            return (
                                <tr key={order.id}>
                                    <td>{index + 1}</td>
                                    <td className="order-id-cell">
                                        #{order.id?.split('-')[1] || order.id}
                                    </td>
                                    <td className="date-cell">
                                        {new Date(order.date).toLocaleString('vi-VN', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <span className={`pay-tag ${order.paymentMethod?.toLowerCase()}`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="price-cell">
                                        {(order.payableAmount ?? order.totalAmount)
                                            ?.toLocaleString('vi-VN')} VNĐ
                                    </td>
                                    <td>
                                        <span className={`status-badge ${badge.cls}`}>
                                            {badge.label}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="action-btn detail-btn"
                                            onClick={() => navigate(`/order-detail/${order.id}`)}
                                        >
                                            Xem Chi Tiết
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="no-data">
                                    Bạn chưa có đơn hàng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;
