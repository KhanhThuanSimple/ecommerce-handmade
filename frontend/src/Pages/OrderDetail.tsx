import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../Styles/orderDetail.css';

const OrderDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        void fetchOrderDetail();
    }, [id]);

    if (!order) return <div className="loading">Đang tải...</div>;

    const handlePaymentAction = () => {
        navigate('/checkout', { state: { rePayOrder: order } });
    };

    const renderPaymentStatus = () => {
        const isPaid = ['Đã thanh toán', 'Thanh toán khi nhận hàng', 'Hoàn thành'].includes(order.status);

        if (isPaid) {
            return (
                <span className="pill-status-btn paid">
                    {order.status === 'Thanh toán khi nhận hàng' ? 'Thanh toán khi nhận hàng' : 'Đã thanh toán'}
                </span>
            );
        }

        return (
            <button
                className="pill-status-btn unpaid repay-trigger"
                onClick={handlePaymentAction}
            >
                <span className="btn-text">
                    {order.status === 'Đã hủy' ? 'Đã hủy (Đặt lại)' : 'Chưa thanh toán'}
                </span>
            </button>
        );
    };

    return (
        <div className="handmade-order-page">
            <div className="top-nav-back">
                <button className="btn-back-square" onClick={() => navigate(-1)}>
                    Quay lại
                </button>
            </div>

            <div className="order-detail-card">
                <div className="order-main-header">
                    <div className="header-left">
                        <h2>Chi Tiết Đơn Hàng</h2>
                        <p>Mã đơn hàng: <strong>#{order.id}</strong></p>
                    </div>
                    <div className="header-right">
                        <div className="status-badge-item">
                            <span>Trạng thái thanh toán:</span>
                            {renderPaymentStatus()}
                        </div>
                        <div className="status-badge-item">
                            <span>Trạng thái đơn hàng:</span>
                            {/* Ép trạng thái hiển thị là Đang xử lý nếu là COD hoặc đơn mới */}
                            <span className={`pill-status-btn status-sync ${order.status === 'Đã hủy' ? 'canceled-style' : 'processing-style'}`}>
                                {order.status === 'Đã hủy' ? 'Đã hủy' : 'Đang xử lý'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="order-content-grid">
                    <div className="info-column">
                        <h4 className="title-with-icon">
                            <i className="fa-solid fa-circle-info"></i> Thông tin đơn hàng
                        </h4>
                        <div className="info-list-details">
                            <div className="item"><strong>Ngày đặt:</strong> <span>{order.date}</span></div>
                            <div className="item"><strong>Khách hàng:</strong> <span>{order.fullName}</span></div>
                            <div className="item"><strong>Điện thoại:</strong> <span>{order.phone}</span></div>
                            <div className="item"><strong>Địa chỉ:</strong> <span className="addr">{order.address}</span></div>
                            <div className="item"><strong>PT thanh toán:</strong> <span>{order.paymentMethod}</span></div>
                            <div className="item"><strong>Phí vận chuyển:</strong> <span>₫0</span></div>
                        </div>
                    </div>

                    <div className="product-column">
                        <h4 className="title-with-icon">
                            <i className="fa-solid fa-box-open"></i> Sản phẩm đã đặt
                        </h4>
                        <table className="handmade-table">
                            <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            {order.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="prod-cell">
                                        <img src={item.product.imageUrl} alt="" />
                                        <span>{item.product.name}</span>
                                    </td>
                                    <td>₫{item.product.price.toLocaleString()}</td>
                                    <td>{item.quantity}</td>
                                    <td className="item-subtotal">₫{(item.product.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="pricing-summary">
                            <div className="p-row"><span>Tạm tính:</span> <span>₫{order.totalAmount.toLocaleString()}</span></div>
                            <div className="p-row"><span>Phí vận chuyển:</span> <span>₫0</span></div>
                            <div className="p-row grand-total"><span>Tổng cộng:</span> <span>₫{order.totalAmount.toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>

                <div className="order-footer-actions">
                    <button className="btn-print-handmade" onClick={() => window.print()}>
                        in hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;