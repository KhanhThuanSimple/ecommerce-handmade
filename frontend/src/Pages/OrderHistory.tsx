import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types/model';
import '../Styles/orders.css';

interface OrderHistoryProps { currentUser: User | null; }

const OrderHistory: React.FC<OrderHistoryProps> = ({ currentUser }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 1. Fetch dữ liệu
    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;
            try {
                const res = await api.get(`/orders?userId=${currentUser.id}`);
                // Sắp xếp đơn mới nhất lên đầu dựa trên ID hoặc Date
                const sortedOrders = res.data.sort((a: any, b: any) => b.id.localeCompare(a.id));
                setOrders(sortedOrders);
            } catch (err) {
                console.error("Lỗi tải đơn hàng:", err);
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
                <h2><i className="fa-solid fa-box-open"></i> Lịch Sử Đơn Hàng</h2>
                <p>Bạn có tổng cộng <strong>{orders.length}</strong> đơn hàng đã thực hiện</p>
            </div>

            <div className="table-container">
                <table className="order-dashboard-table">
                    <thead>
                    <tr>
                        <th style={{ width: '50px' }}>STT</th>
                        <th>Mã Đơn</th>
                        <th>Ngày Đặt</th>
                        <th>Hình thức</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                        <th style={{ textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.length > 0 ? (
                        orders.map((order, index) => (
                            <tr key={order.id}>
                                {/* STT đếm số thứ tự chuẩn */}
                                <td>{index + 1}</td>
                                <td className="order-id-cell">#{order.id.split('-')[1] || order.id}</td>
                                <td>{order.date}</td>
                                <td><span className={`pay-tag ${order.paymentMethod.toLowerCase()}`}>{order.paymentMethod}</span></td>

                                <td className="price-cell">₫{order.totalAmount.toLocaleString('vi-VN')}</td>


                                <td>
                                        <span className={`status-badge ${order.status === 'Chờ thanh toán' ? 'pending' : 'completed'}`}>
                                            {order.status}
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="no-data">Bạn chưa có đơn hàng nào.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;