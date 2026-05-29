import React, { useState, useEffect } from 'react';
import {
    EyeIcon,
    PencilIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: number;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: 'cod' | 'banking' | 'momo';
    paymentStatus: 'pending' | 'paid' | 'failed';
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
}

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stats, setStats] = useState<OrderStats>({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
    });
    
    const notify = useNotify();

    // Mock data - replace with API call
    useEffect(() => {
        const mockOrders: Order[] = [
            {
                id: 1,
                orderCode: 'ORD-2026-0001',
                customerName: 'Nguyễn Thị Hoa',
                customerPhone: '0987654321',
                customerEmail: 'hoa.nguyen@email.com',
                customerAddress: '123 Đường Láng, Đống Đa, Hà Nội',
                totalAmount: 1250000,
                discount: 125000,
                finalAmount: 1125000,
                status: 'pending',
                paymentMethod: 'cod',
                paymentStatus: 'pending',
                createdAt: '2026-01-15T10:30:00',
                updatedAt: '2026-01-15T10:30:00',
                items: [
                    { id: 1, productName: 'Bộ ấm trà gốm sứ', quantity: 1, price: 850000, total: 850000 },
                    { id: 2, productName: 'Tượng Ngựa Phong Thủy', quantity: 1, price: 400000, total: 400000 },
                ],
            },
            {
                id: 2,
                orderCode: 'ORD-2026-0002',
                customerName: 'Trần Văn Lộc',
                customerPhone: '0978123456',
                customerEmail: 'loc.tran@email.com',
                customerAddress: '456 Nguyễn Trãi, Thanh Xuân, Hà Nội',
                totalAmount: 2300000,
                discount: 230000,
                finalAmount: 2070000,
                status: 'processing',
                paymentMethod: 'banking',
                paymentStatus: 'paid',
                createdAt: '2026-01-14T15:45:00',
                updatedAt: '2026-01-14T16:00:00',
                items: [
                    { id: 3, productName: 'Bộ tranh thêu tay', quantity: 1, price: 1800000, total: 1800000 },
                    { id: 4, productName: 'Voucher 50.000đ', quantity: 1, price: 500000, total: 500000 },
                ],
            },
            {
                id: 3,
                orderCode: 'ORD-2026-0003',
                customerName: 'Lê Thị Xuân',
                customerPhone: '0965234789',
                customerEmail: 'xuan.le@email.com',
                customerAddress: '789 Lê Lợi, Quận 1, TP.HCM',
                totalAmount: 560000,
                discount: 0,
                finalAmount: 560000,
                status: 'delivered',
                paymentMethod: 'momo',
                paymentStatus: 'paid',
                createdAt: '2026-01-13T09:15:00',
                updatedAt: '2026-01-14T14:30:00',
                items: [
                    { id: 5, productName: 'Vòng tay handmade', quantity: 2, price: 280000, total: 560000 },
                ],
            },
            {
                id: 4,
                orderCode: 'ORD-2026-0004',
                customerName: 'Phạm Văn Thành',
                customerPhone: '0945678901',
                customerEmail: 'thanh.pham@email.com',
                customerAddress: '321 Hoàng Diệu, Hải Châu, Đà Nẵng',
                totalAmount: 3450000,
                discount: 345000,
                finalAmount: 3105000,
                status: 'shipped',
                paymentMethod: 'banking',
                paymentStatus: 'paid',
                createdAt: '2026-01-12T11:20:00',
                updatedAt: '2026-01-13T08:00:00',
                items: [
                    { id: 6, productName: 'Bộ lư hương đồng', quantity: 1, price: 2500000, total: 2500000 },
                    { id: 7, productName: 'Đĩa gốm sứ', quantity: 3, price: 150000, total: 450000 },
                    { id: 8, productName: 'Tách trà', quantity: 2, price: 250000, total: 500000 },
                ],
            },
            {
                id: 5,
                orderCode: 'ORD-2026-0005',
                customerName: 'Đỗ Thị Mai',
                customerPhone: '0978123490',
                customerEmail: 'mai.do@email.com',
                customerAddress: '567 Hai Bà Trưng, Huế',
                totalAmount: 890000,
                discount: 89000,
                finalAmount: 801000,
                status: 'cancelled',
                paymentMethod: 'cod',
                paymentStatus: 'failed',
                createdAt: '2026-01-11T14:00:00',
                updatedAt: '2026-01-11T16:30:00',
                items: [
                    { id: 9, productName: 'Nón lá bài thơ', quantity: 2, price: 150000, total: 300000 },
                    { id: 10, productName: 'Hoa tay', quantity: 1, price: 590000, total: 590000 },
                ],
            },
        ];
        
        setOrders(mockOrders);
        calculateStats(mockOrders);
        setLoading(false);
    }, []);

    const calculateStats = (ordersData: Order[]) => {
        const totalOrders = ordersData.length;
        const totalRevenue = ordersData
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + o.finalAmount, 0);
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
        
        setStats({ totalOrders, totalRevenue, pendingOrders, deliveredOrders });
    };

    const getStatusBadgeClass = (status: Order['status']) => {
        const classes = {
            pending: 'order-status pending',
            processing: 'order-status processing',
            shipped: 'order-status shipped',
            delivered: 'order-status delivered',
            cancelled: 'order-status cancelled',
        };
        return classes[status];
    };

    const getStatusText = (status: Order['status']) => {
        const texts = {
            pending: 'Chờ xử lý',
            processing: 'Đang xử lý',
            shipped: 'Đang giao',
            delivered: 'Hoàn thành',
            cancelled: 'Đã hủy',
        };
        return texts[status];
    };

    const getPaymentMethodText = (method: Order['paymentMethod']) => {
        const texts = {
            cod: 'COD - Thanh toán khi nhận hàng',
            banking: 'Chuyển khoản ngân hàng',
            momo: 'Ví Momo',
        };
        return texts[method];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const handleUpdateStatus = async (orderId: number, newStatus: Order['status']) => {
        if (window.confirm(`Xác nhận chuyển đơn hàng sang trạng thái "${getStatusText(newStatus)}"?`)) {
            try {
                // API call here
                notify.success(`Đã cập nhật trạng thái đơn hàng thành ${getStatusText(newStatus)}`);
                // Refresh orders
            } catch (error) {
                notify.error('Cập nhật thất bại');
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        const matchesSearch = searchTerm === '' || 
            order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerPhone.includes(searchTerm);
        const matchesDate = (!dateFrom || order.createdAt >= dateFrom) && (!dateTo || order.createdAt <= dateTo);
        return matchesStatus && matchesSearch && matchesDate;
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang tải danh sách đơn hàng...</p>
            </div>
        );
    }

    return (
        <div className="orders-container">
            {/* Header */}
            <div className="orders-header">
                <div className="orders-title">
                    <h1>
                        📦 Quản Lý Đơn Hàng
                    </h1>
                    <p>Quản lý và theo dõi tất cả đơn hàng trên hệ thống</p>
                </div>
                <div className="export-buttons">
                    <button className="export-btn">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="orders-stats">
                <div className="order-stat-card">
                    <div className="order-stat-value">{stats.totalOrders}</div>
                    <div className="order-stat-label">Tổng đơn hàng</div>
                </div>
                <div className="order-stat-card">
                    <div className="order-stat-value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="order-stat-label">Doanh thu</div>
                </div>
                <div className="order-stat-card">
                    <div className="order-stat-value">{stats.pendingOrders}</div>
                    <div className="order-stat-label">Đơn chờ xử lý</div>
                </div>
                <div className="order-stat-card">
                    <div className="order-stat-value">{stats.deliveredOrders}</div>
                    <div className="order-stat-label">Đơn hoàn thành</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Trạng thái:</label>
                    <select 
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đang giao</option>
                        <option value="delivered">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Tìm kiếm:</label>
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Mã đơn, tên khách, SĐT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Ngày:</label>
                    <div className="filter-date-range">
                        <input
                            type="date"
                            className="filter-date-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <span>→</span>
                        <input
                            type="date"
                            className="filter-date-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <button className="reset-button" onClick={() => {
                    setFilterStatus('all');
                    setSearchTerm('');
                    setDateFrom('');
                    setDateTo('');
                }}>
                    Đặt lại
                </button>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Mã đơn hàng</th>
                            <th>Khách hàng</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Thanh toán</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id} onClick={() => handleViewOrder(order)}>
                                <td className="order-id">{order.orderCode}</td>
                                <td>
                                    <div className="customer-info">
                                        <span className="customer-name">{order.customerName}</span>
                                        <span className="customer-phone">{order.customerPhone}</span>
                                    </div>
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td className="order-amount">{formatCurrency(order.finalAmount)}</td>
                                <td>
                                    <span className={getStatusBadgeClass(order.status)}>
                                        {getStatusText(order.status)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </span>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="order-actions">
                                        <button 
                                            className="order-action-btn view"
                                            onClick={() => handleViewOrder(order)}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                            <button 
                                                className="order-action-btn update"
                                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">Không có đơn hàng</div>
                        <div className="empty-state-description">Không tìm thấy đơn hàng nào phù hợp</div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="order-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="order-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="order-modal-header">
                            <h3 className="order-modal-title">Chi tiết đơn hàng #{selectedOrder.orderCode}</h3>
                            <button className="order-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="order-modal-body">
                            <div className="order-info-grid">
                                <div className="order-info-item">
                                    <div className="order-info-label">Khách hàng</div>
                                    <div className="order-info-value">{selectedOrder.customerName}</div>
                                </div>
                                <div className="order-info-item">
                                    <div className="order-info-label">Số điện thoại</div>
                                    <div className="order-info-value">{selectedOrder.customerPhone}</div>
                                </div>
                                <div className="order-info-item">
                                    <div className="order-info-label">Email</div>
                                    <div className="order-info-value">{selectedOrder.customerEmail}</div>
                                </div>
                                <div className="order-info-item">
                                    <div className="order-info-label">Địa chỉ</div>
                                    <div className="order-info-value">{selectedOrder.customerAddress}</div>
                                </div>
                                <div className="order-info-item">
                                    <div className="order-info-label">Phương thức thanh toán</div>
                                    <div className="order-info-value">{getPaymentMethodText(selectedOrder.paymentMethod)}</div>
                                </div>
                                <div className="order-info-item">
                                    <div className="order-info-label">Trạng thái đơn hàng</div>
                                    <div className="order-info-value">
                                        <span className={getStatusBadgeClass(selectedOrder.status)}>
                                            {getStatusText(selectedOrder.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)' }}>Sản phẩm</h4>
                            <table className="order-items-table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Số lượng</th>
                                        <th>Đơn giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.price)}</td>
                                            <td>{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Tạm tính:</td>
                                        <td>{formatCurrency(selectedOrder.totalAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Giảm giá:</td>
                                        <td style={{ color: 'var(--success)' }}>-{formatCurrency(selectedOrder.discount)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>Tổng cộng:</td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary-red)', fontSize: '1rem' }}>
                                            {formatCurrency(selectedOrder.finalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="modal-actions" style={{ marginTop: 'var(--space-6)' }}>
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                                {selectedOrder.status === 'pending' && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            handleUpdateStatus(selectedOrder.id, 'processing');
                                            setShowModal(false);
                                        }}
                                    >
                                        Xác nhận đơn hàng
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;