// src/pages/Admin/AdminOrders.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  EyeIcon,
  PencilIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// ==================== TYPES ====================
interface OrderItemResponse {
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  quantity: number;
}

interface OrderHistoryResponse {
  action: string;
  oldStatus: string;
  newStatus: string;
  note: string;
  performedBy: string;
  performedByRole: string;
  performedAt: string;
}

interface OrderResponse {
  id: string;
  userId: number;
  fullName: string;
  customerEmail: string;
  phone: string;
  address: string;
  items: OrderItemResponse[];
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  voucherCode: string;
  paymentMethod: string;
  status: string;
  date: string;
  createdAt?: string;
  history?: OrderHistoryResponse[];
}

interface AdminOrderSummaryResponse {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  paymentMethodStats: Record<string, number>;
  topProducts: Record<string, number>;
  dailyRevenue: Record<string, number>;
}

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('vi-VN');
};

const getStoredAccount = () => {
  const candidates = ['user', 'adminUser', 'currentUser', 'authUser'];

  for (const key of candidates) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // ignore invalid JSON and fall through
    }
  }

  return null;
};

const getAdminId = () => {
  const account = getStoredAccount();
  const id = account?.id ?? account?.userId ?? account?.adminId ?? account?.user?.id ?? account?.admin?.id;
  return id ? String(id) : '';
};

// ==================== STATUS BADGE COMPONENT ====================
const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const normalized = status?.toLowerCase() || '';
    
    if (normalized.includes('chờ thanh toán')) return { label: 'Chờ thanh toán', class: 'status-pending' };
    if (normalized.includes('đã thanh toán')) return { label: 'Đã thanh toán', class: 'status-paid' };
    if (normalized.includes('đang xử lý')) return { label: 'Đang xử lý', class: 'status-processing' };
    if (normalized.includes('đang giao')) return { label: 'Đang giao hàng', class: 'status-shipping' };
    if (normalized.includes('hoàn thành')) return { label: 'Hoàn thành', class: 'status-completed' };
    if (normalized.includes('đã hủy')) return { label: 'Đã hủy', class: 'status-cancelled' };
    if (normalized.includes('cod')) return { label: 'COD', class: 'status-cod' };
    
    return { label: status || 'Không xác định', class: 'status-default' };
  };

  const config = getStatusConfig(status);
  return <span className={`order-status-badge ${config.class}`}>{config.label}</span>;
};

const PaymentMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const getMethodConfig = (method: string) => {
    const normalized = method?.toUpperCase() || '';
    
    if (normalized === 'COD') return { label: 'COD - Thanh toán khi nhận', icon: '💵', class: 'method-cod' };
    if (normalized === 'VNPAY') return { label: 'VNPay', icon: '🏦', class: 'method-vnpay' };
    if (normalized.includes('MOMO')) return { label: 'MoMo', icon: '📱', class: 'method-momo' };
    
    return { label: method || 'Khác', icon: '💳', class: 'method-default' };
  };

  const config = getMethodConfig(method);
  return (
    <span className={`payment-method-badge ${config.class}`}>
      <span className="method-icon">{config.icon}</span> {config.label}
    </span>
  );
};

// ==================== UPDATE STATUS MODAL ====================
const UpdateStatusModal: React.FC<{
  isOpen: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onUpdate: (orderId: string, status: string, note: string) => Promise<void>;
}> = ({ isOpen, order, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const STATUS_OPTIONS = [
    'Chờ thanh toán', 'Đã thanh toán', 'Đang xử lý', 'Đang giao hàng', 'Hoàn thành'
  ];

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;
    setLoading(true);
    try {
      await onUpdate(order.id, selectedStatus, note);
      onClose();
      setSelectedStatus('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cập nhật trạng thái đơn hàng</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-row"><span>Mã đơn:</span><strong>{order.id}</strong></div>
            <div className="info-row"><span>Khách hàng:</span><strong>{order.fullName}</strong></div>
            <div className="info-row"><span>Trạng thái hiện tại:</span><OrderStatusBadge status={order.status} /></div>
            <div className="form-group">
              <label className="form-label required">Trạng thái mới:</label>
              <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} required>
                <option value="">-- Chọn --</option>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú:</label>
              <textarea className="form-textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang xử lý...' : 'Cập nhật'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== CANCEL ORDER MODAL ====================
const CancelOrderModal: React.FC<{
  isOpen: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => Promise<void>;
}> = ({ isOpen, order, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(order.id, reason);
      onClose();
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Xác nhận hủy đơn hàng</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="warning-message">⚠️ Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.id}</strong>?</div>
            <div className="form-group">
              <label className="form-label required">Lý do hủy:</label>
              <textarea className="form-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do..." required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Quay lại</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác nhận hủy'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== ORDER DETAIL MODAL ====================
const OrderDetailModal: React.FC<{
  isOpen: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onUpdateStatus: (order: OrderResponse) => void;
  onCancel: (order: OrderResponse) => void;
}> = ({ isOpen, order, onClose, onUpdateStatus, onCancel }) => {
  const [orderDetail, setOrderDetail] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    if (!order) return;
    setLoading(true);
    try {
      const response = await api.get(`/admin/orders/${order.id}`, {
        headers: { adminId: getAdminId() }
      });
      setOrderDetail(response.data);
    } catch (error) {
      console.error('Load detail error:', error);
    } finally {
      setLoading(false);
    }
  }, [order]);

  useEffect(() => {
    if (isOpen && order) {
      loadOrderDetail();
    }
  }, [isOpen, order, loadOrderDetail]);

  if (!isOpen || !orderDetail) return null;

  const canCancel = !['Hoàn thành', 'Đã hủy'].includes(orderDetail.status);
  const canUpdate = !['Hoàn thành', 'Đã hủy'].includes(orderDetail.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chi tiết đơn hàng #{orderDetail.id}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading-overlay">Đang tải...</div>}
          
          {/* Thông tin khách hàng */}
          <div className="info-section">
            <h4>Thông tin khách hàng</h4>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Tên:</span><span>{orderDetail.fullName}</span></div>
              <div className="info-item"><span className="info-label">Email:</span><span>{orderDetail.customerEmail || 'N/A'}</span></div>
              <div className="info-item"><span className="info-label">SĐT:</span><span>{orderDetail.phone}</span></div>
              <div className="info-item"><span className="info-label">Địa chỉ:</span><span>{orderDetail.address}</span></div>
            </div>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="info-section">
            <h4>Thông tin đơn hàng</h4>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Ngày đặt:</span><span>{formatDateTime(orderDetail.date || orderDetail.createdAt)}</span></div>
              <div className="info-item"><span className="info-label">Trạng thái:</span><OrderStatusBadge status={orderDetail.status} /></div>
              <div className="info-item"><span className="info-label">Thanh toán:</span><PaymentMethodBadge method={orderDetail.paymentMethod} /></div>
              {orderDetail.voucherCode && <div className="info-item"><span className="info-label">Mã giảm giá:</span><span className="voucher-code">{orderDetail.voucherCode}</span></div>}
            </div>
          </div>

          {/* Sản phẩm */}
          <div className="info-section">
            <h4>Chi tiết sản phẩm</h4>
            <table className="order-items-table">
              <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {orderDetail.items.map((item, idx) => (
                  <tr key={idx}>
                    <td><div className="product-info">{item.productImageUrl && <img src={item.productImageUrl} alt="" className="product-image" />}{item.productName}</div></td>
                    <td>{formatCurrency(item.productPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.productPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} className="text-right">Tạm tính:</td><td>{formatCurrency(orderDetail.totalAmount)}</td></tr>
                {orderDetail.discountAmount > 0 && <tr><td colSpan={3} className="text-right">Giảm giá:</td><td className="discount-amount">-{formatCurrency(orderDetail.discountAmount)}</td></tr>}
                <tr className="total-row"><td colSpan={3} className="text-right">Tổng cộng:</td><td className="total-amount">{formatCurrency(orderDetail.payableAmount)}</td></tr>
              </tfoot>
            </table>
          </div>

          {/* Lịch sử */}
          {orderDetail.history && orderDetail.history.length > 0 && (
            <div className="info-section">
              <h4>Lịch sử đơn hàng</h4>
              <div className="history-timeline">
                {orderDetail.history.map((h, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-time">{formatDateTime(h.performedAt)}</div>
                    <div className="history-content">
                      <span className="history-action">{h.action}</span>
                      {h.oldStatus && h.newStatus && <span className="history-status-change">: {h.oldStatus} → {h.newStatus}</span>}
                      {h.note && <div className="history-note">Ghi chú: {h.note}</div>}
                      <div className="history-performer">Bởi: {h.performedBy} ({h.performedByRole})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          {canUpdate && <button className="btn btn-primary" onClick={() => onUpdateStatus(orderDetail)}>Cập nhật</button>}
          {canCancel && <button className="btn btn-danger" onClick={() => onCancel(orderDetail)}>Hủy đơn</button>}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Orders: React.FC = () => {
  // State
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdminOrderSummaryResponse | null>(null);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0, size: 20 });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('size', pagination.size.toString());
      if (statusFilter) params.append('orderStatus', statusFilter);
      if (searchPhone) params.append('phone', searchPhone);
      if (dateFrom) params.append('fromDate', dateFrom);
      if (dateTo) params.append('toDate', dateTo);
      params.append('sortBy', 'createdAt');
      params.append('sortDirection', 'DESC');

      const response = await api.get(`/admin/orders?${params.toString()}`, {
        headers: { adminId: getAdminId() }
      });
      setOrders(response.data.content || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements
      }));
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size, statusFilter, searchPhone, dateFrom, dateTo]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/admin/orders/summary', {
        headers: { adminId: getAdminId() }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Fetch summary error:', error);
    }
  }, []);

  // Trigger fetch khi filter thay đổi (tách riêng khỏi fetchOrders dependency)
  const [filterTrigger, setFilterTrigger] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchSummary();
  }, [fetchOrders, fetchSummary]);

  // Re-fetch khi user nhấn "Tìm kiếm" hoặc "Đặt lại"
  useEffect(() => {
    if (filterTrigger === 0) return; // Bỏ qua lần mount đầu tiên
    fetchOrders();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrigger]);

  // Handlers
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    setFilterTrigger(t => t + 1);
  };

  const handleReset = () => {
    setStatusFilter('');
    setSearchPhone('');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 0 }));
    setFilterTrigger(t => t + 1);
  };

  const handleUpdateStatus = async (orderId: string, status: string, note: string) => {
    await api.put(`/admin/orders/${orderId}/status`, { orderStatus: status, note }, {
      headers: { adminId: getAdminId() }
    });
    fetchOrders();
    fetchSummary();
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    await api.post(`/admin/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, null, {
      headers: { adminId: getAdminId() }
    });
    fetchOrders();
    fetchSummary();
  };

  const handleExportExcel = () => {
    alert('Tính năng đang phát triển');
  };

  return (
    <div className="admin-orders-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Quản Lý Đơn Hàng</h1>
          <p>Quản lý và theo dõi tất cả đơn hàng</p>
        </div>
        <button className="btn btn-outline" onClick={handleExportExcel}>
          <DocumentArrowDownIcon className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {summary ? (
          <>
            <div className="stat-card"><div className="stat-value">{summary.totalOrders ?? 0}</div><div className="stat-label">Tổng đơn</div></div>
            <div className="stat-card"><div className="stat-value">{summary.totalRevenue != null ? formatCurrency(summary.totalRevenue) : '0 ₫'}</div><div className="stat-label">Doanh thu</div></div>
            <div className="stat-card"><div className="stat-value">{summary.pendingOrders ?? 0}</div><div className="stat-label">Chờ thanh toán</div></div>
            <div className="stat-card"><div className="stat-value">{summary.processingOrders ?? 0}</div><div className="stat-label">Đang xử lý</div></div>
            <div className="stat-card"><div className="stat-value">{summary.completedOrders ?? 0}</div><div className="stat-label">Hoàn thành</div></div>
            <div className="stat-card"><div className="stat-value">{summary.cancelledOrders ?? 0}</div><div className="stat-label">Đã hủy</div></div>
          </>
        ) : (
          /* Skeleton giữ chỗ khi đang tải */
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="stat-card">
              <div className="stat-value" style={{ background: 'var(--gray-200)', borderRadius: 6, minHeight: 28, minWidth: 60, color: 'transparent' }}>—</div>
              <div className="stat-label" style={{ background: 'var(--gray-100)', borderRadius: 4, minHeight: 12, marginTop: 6, color: 'transparent' }}>—</div>
            </div>
          ))
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="Chờ thanh toán">Chờ thanh toán</option>
          <option value="Đã thanh toán">Đã thanh toán</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đang giao hàng">Đang giao hàng</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Đã hủy">Đã hủy</option>
        </select>
        <input type="text" className="filter-input" placeholder="Tìm theo SĐT..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
        <div className="filter-date-range">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Từ ngày" />
          <span>→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Đến ngày" />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>Tìm kiếm</button>
        <button className="btn btn-secondary" onClick={handleReset}>Đặt lại</button>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="order-id">{order.id}</td>
                <td>{order.fullName}</td>
                <td className="phone">{order.phone}</td>
                <td>{formatDate(order.date || order.createdAt)}</td>
                <td className="amount">{formatCurrency(order.payableAmount)}</td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td><PaymentMethodBadge method={order.paymentMethod} /></td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn view" onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }} title="Xem chi tiết"><EyeIcon className="w-4 h-4" /></button>
                    {!['Hoàn thành', 'Đã hủy'].includes(order.status) && (
                      <>
                        <button className="action-btn edit" onClick={() => { setSelectedOrder(order); setShowUpdateModal(true); }} title="Cập nhật"><PencilIcon className="w-4 h-4" /></button>
                        <button className="action-btn delete" onClick={() => { setSelectedOrder(order); setShowCancelModal(true); }} title="Hủy đơn"><XCircleIcon className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && !loading && (
          <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-title">Không có đơn hàng</div></div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="pagination">
            <div className="pagination-info">Hiển thị {(pagination.page * pagination.size) + 1} - {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} trên {pagination.totalElements} đơn</div>
            <div className="pagination-controls">
              <select className="page-size-select" value={pagination.size} onChange={(e) => setPagination(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))}>
                <option value={10}>10 / trang</option><option value={20}>20 / trang</option><option value={50}>50 / trang</option>
              </select>
              <button className="page-btn" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 0}><ChevronLeftIcon className="w-4 h-4" /></button>
              <span className="page-current">Trang {pagination.page + 1} / {pagination.totalPages}</span>
              <button className="page-btn" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page + 1 >= pagination.totalPages}><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal isOpen={showDetailModal} order={selectedOrder} onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }} onUpdateStatus={(order) => { setShowDetailModal(false); setSelectedOrder(order); setShowUpdateModal(true); }} onCancel={(order) => { setShowDetailModal(false); setSelectedOrder(order); setShowCancelModal(true); }} />
      <UpdateStatusModal isOpen={showUpdateModal} order={selectedOrder} onClose={() => { setShowUpdateModal(false); setSelectedOrder(null); }} onUpdate={handleUpdateStatus} />
      <CancelOrderModal isOpen={showCancelModal} order={selectedOrder} onClose={() => { setShowCancelModal(false); setSelectedOrder(null); }} onConfirm={handleCancelOrder} />
    </div>
  );
};

export default Orders; 