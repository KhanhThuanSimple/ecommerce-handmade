import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../Styles/orderDetail.css';

// ── Helpers ──────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cssClass: string }> = {
    'Chờ thanh toán':        { label: 'Chờ thanh toán',        cssClass: 'pending' },
    'Đã thanh toán':         { label: 'Đã thanh toán',          cssClass: 'paid' },
    'Thanh toán thất bại':   { label: 'Thanh toán thất bại',    cssClass: 'failed' },
    'Thanh toán khi nhận hàng': { label: 'Thanh toán khi nhận hàng', cssClass: 'cod' },
    'Hoàn thành':            { label: 'Hoàn thành',             cssClass: 'paid' },
    'Đã hủy':                { label: 'Đã hủy',                 cssClass: 'failed' },
};

const isPaidStatus = (status: string) => {
    const s = status?.toLowerCase() ?? '';
    return ['đã thanh toán', 'hoàn thành', 'completed', 'paid'].includes(s);
};

const isCodStatus = (status: string) =>
    status?.toLowerCase() === 'thanh toán khi nhận hàng';

const isCanceledStatus = (status: string) => status?.toLowerCase() === 'đã hủy';

const isFailedStatus = (status: string) =>
    status?.toLowerCase() === 'thanh toán thất bại';

// ── Component ────────────────────────────────────────────
const OrderDetail: React.FC = () => {
    const { id }   = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res?.data ?? null);
            } catch (err) {
                console.error(err);
            }
        };
        void fetchOrderDetail();
    }, [id]);

    if (!order) return <div className="loading">Đang tải...</div>;

    const m = (order.paymentMethod ?? '').toUpperCase().trim();
    const isVnPay = m === 'VNPAY' || m === 'VN PAY';

    // ── Payment status badge ──
    const renderPaymentStatus = () => {
        if (isVnPay) {
            return <span className="pill-status-btn paid">✓ Đã thanh toán VNPay</span>;
        }
        if (isPaidStatus(order.status)) {
            return <span className="pill-status-btn paid">✓ Đã thanh toán</span>;
        }
        if (isCodStatus(order.status)) {
            return <span className="pill-status-btn cod">Thanh toán COD</span>;
        }
        if (isFailedStatus(order.status)) {
            return (
                <button
                    className="pill-status-btn failed repay-trigger"
                    onClick={() => navigate('/checkout', { state: { rePayOrder: order } })}
                >
                    ✕ Thanh toán thất bại — Thử lại
                </button>
            );
        }
        if (isCanceledStatus(order.status)) {
            return (
                <button
                    className="pill-status-btn failed repay-trigger"
                    onClick={() => navigate('/checkout', { state: { rePayOrder: order } })}
                >
                    Đã hủy — Đặt lại
                </button>
            );
        }
        // Chờ thanh toán (VNPay chưa xử lý)
        return (
            <button
                className="pill-status-btn unpaid repay-trigger"
                onClick={() => navigate('/checkout', { state: { rePayOrder: order } })}
            >
                Chưa thanh toán — Thanh toán ngay
            </button>
        );
    };

    // ── Order status badge ──
    const renderOrderStatus = () => {
        if (isVnPay) {
            return (
                <span className={`pill-status-btn status-sync paid-style`}>
                    Đã thanh toán VNPay
                </span>
            );
        }
        const cfg = STATUS_CONFIG[order.status];
        const label    = cfg?.label    ?? order.status;
        const cssClass = cfg?.cssClass ?? 'pending';
        return (
            <span className={`pill-status-btn status-sync ${cssClass}-style`}>
                {label}
            </span>
        );
    };

    return (
        <div className="handmade-order-page">
            <div className="top-nav-back">
                <button className="btn-back-square" onClick={() => navigate(-1)}>
                    ← Quay lại
                </button>
            </div>

            <div className="order-detail-card">
                {/* ── Header ── */}
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
                            {renderOrderStatus()}
                        </div>
                    </div>
                </div>

                {/* ── VNPay transaction ref ── */}
                {order.vnpayTranNo && (
                    <div style={{
                        background: '#e8f5e9',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: '#2e7d32',
                    }}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }} />
                        Mã giao dịch VNPay: <strong>{order.vnpayTranNo}</strong>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="order-content-grid">
                    {/* Thông tin đơn hàng */}
                    <div className="info-column">
                        <h4 className="title-with-icon">
                            <i className="fa-solid fa-circle-info" /> Thông tin đơn hàng
                        </h4>
                        <div className="info-list-details">
                            <div className="item"><strong>Ngày đặt:</strong>       <span>{order.date}</span></div>
                            <div className="item"><strong>Khách hàng:</strong>     <span>{order.fullName}</span></div>
                            <div className="item"><strong>Điện thoại:</strong>     <span>{order.phone}</span></div>
                            <div className="item"><strong>Địa chỉ:</strong>        <span className="addr">{order.address}</span></div>
                            <div className="item"><strong>PT thanh toán:</strong>  <span>{order.paymentMethod}</span></div>
                            <div className="item"><strong>Phí vận chuyển:</strong> <span>0 VNĐ</span></div>
                            {order.voucherCode && (
                                <div className="item"><strong>Voucher:</strong> <span>{order.voucherCode}</span></div>
                            )}
                        </div>
                    </div>

                    {/* Sản phẩm */}
                    <div className="product-column">
                        <h4 className="title-with-icon">
                            <i className="fa-solid fa-box-open" /> Sản phẩm đã đặt
                        </h4>
                        <table className="handmade-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Đơn giá</th>
                                    <th>SL</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="prod-cell">
                                            {item.productImageUrl && (
                                                <img src={item.productImageUrl} alt="" />
                                            )}
                                            <span>{item.productName}</span>
                                        </td>
                                        <td>{item.productPrice?.toLocaleString('vi-VN')} VNĐ</td>
                                        <td>{item.quantity}</td>
                                        <td className="item-subtotal">
                                            {((item.productPrice ?? 0) * item.quantity).toLocaleString('vi-VN')} VNĐ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pricing-summary">
                            <div className="p-row">
                                <span>Tạm tính:</span>
                                <span>{order.totalAmount?.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                            {(order.discountAmount ?? 0) > 0 && (
                                <div className="p-row">
                                    <span>Giảm giá:</span>
                                    <span style={{ color: '#e53935' }}>
                                        -{order.discountAmount?.toLocaleString('vi-VN')} VNĐ
                                    </span>
                                </div>
                            )}
                            <div className="p-row"><span>Phí vận chuyển:</span><span>0 VNĐ</span></div>
                            <div className="p-row grand-total">
                                <span>Tổng cộng:</span>
                                <span>{(order.payableAmount ?? order.totalAmount)?.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="order-footer-actions">
                    <button className="btn-print-handmade" onClick={() => window.print()}>
                        <i className="fa-solid fa-print" /> In hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
