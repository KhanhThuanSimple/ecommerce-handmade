// src/admin/pages/Dashboard.tsx
import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    UsersIcon, ShoppingBagIcon, ShoppingCartIcon, CurrencyDollarIcon,
    StarIcon, HeartIcon, CalendarDaysIcon, XCircleIcon, ArrowPathIcon,
    ArrowRightIcon, ClockIcon, BellAlertIcon, CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSuperDashboard } from '../../services/useSuperDashboard';
import '../styles/dashboard.css';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const mapStatusColor = (status: string) => {
    if (!status) return '#9ca3af';
    const lower = status.toLowerCase();
    if (lower.includes('hoàn thành') || lower.includes('đã thanh toán') || lower.includes('completed')) return '#10b981';
    if (lower.includes('đang giao') || lower.includes('shipping')) return '#3b82f6';
    if (lower.includes('chờ') || lower.includes('pending') || lower.includes('nhận hàng')) return '#f59e0b';
    if (lower.includes('hủy') || lower.includes('thất bại') || lower.includes('failed') || lower.includes('canceled')) return '#ef4444';
    return '#8b5cf6';
};

const Dashboard: React.FC = () => {
    const { data, loading, error, dateRange, setDateRange, refresh } = useSuperDashboard();

    const handleExportReport = async () => {
        window.dispatchEvent(new CustomEvent('global-toast', { detail: { msg: 'Yêu cầu đang gửi...', type: 'info' } }));
        try {
            const response = await api.get('/admin/analytics/export-report');
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { msg: response.data.message, type: 'info' } }));
        } catch (err: any) {
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { msg: 'Lỗi gửi yêu cầu xuất báo cáo', type: 'error' } }));
        }
    };

    if (loading) {
        return (
            <div className="super-dashboard loading-container">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu Trung tâm điều khiển...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="super-dashboard error-container">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
                <h3>{error || 'Lỗi tải dữ liệu'}</h3>
                <button onClick={refresh} className="refresh-btn">Thử lại</button>
            </div>
        );
    }

    // 1. Line Chart: Revenue
    const revenueLabels = data.revenueTrend.map(t => t.date_label);
    const revenueValues = data.revenueTrend.map(t => t.daily_revenue);
    const lineChartData = {
        labels: revenueLabels,
        datasets: [{
            label: 'Doanh thu (VND)',
            data: revenueValues,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#8b5cf6',
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    };
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
        scales: {
            x: { grid: { display: false } },
            y: { border: { dash: [4, 4] }, grid: { color: '#e5e7eb' }, beginAtZero: true }
        },
        interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
    };

    // 2. Doughnut Chart: Order Status
    const statusLabels = data.orderStatuses.map(s => s.name);
    const statusValues = data.orderStatuses.map(s => s.value);
    const statusColors = statusLabels.map(mapStatusColor);
    const doughnutData = {
        labels: statusLabels,
        datasets: [{
            data: statusValues,
            backgroundColor: statusColors,
            borderWidth: 0,
            hoverOffset: 4
        }]
    };
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const } },
        cutout: '70%'
    };

    // 3. Bar Chart: Top Categories
    const catLabels = data.topCategories.map(c => c.name);
    const catValues = data.topCategories.map(c => c.sold);
    const barData = {
        labels: catLabels,
        datasets: [{
            label: 'Số lượng đã bán',
            data: catValues,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 6,
            barThickness: 20
        }]
    };
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#e5e7eb' } } }
    };

    return (
        <div className="super-dashboard handmade-dashboard">
            {/* Header */}
            <div className="db-header">
                <div className="db-welcome">
                    <h1>👋 Xin chào, Admin</h1>
                    <p>Chào mừng trở lại! Hôm nay là {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="db-actions">
                    <div className="date-filters">
                        <button className={dateRange === 'today' ? 'active' : ''} onClick={() => setDateRange('today')}>Hôm nay</button>
                        <button className={dateRange === '7days' ? 'active' : ''} onClick={() => setDateRange('7days')}>7 ngày</button>
                        <button className={dateRange === '30days' ? 'active' : ''} onClick={() => setDateRange('30days')}>30 ngày</button>
                        <button className={dateRange === 'year' ? 'active' : ''} onClick={() => setDateRange('year')}>Năm nay</button>
                    </div>
                    <button className="btn-refresh bg-blue-600 text-white font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition" onClick={handleExportReport} style={{border:'none', marginRight: '10px'}}>
                        📥 Xuất báo cáo doanh thu
                    </button>
                    <button className="btn-refresh" onClick={refresh}>
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {data.notifications && data.notifications.length > 0 && (
                <div className="db-notifications">
                    {data.notifications.map((n, i) => (
                        <div key={i} className={`notif-alert type-${n.type}`}>
                            {n.type === 'error' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                             n.type === 'warning' ? <BellAlertIcon className="w-5 h-5" /> :
                             <CheckCircleIcon className="w-5 h-5" />}
                            <span>{n.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 1. KPI Cards */}
            {data.kpi && (
                <div className="db-kpi-grid">
                    <div className="kpi-card color-users">
                        <div className="kpi-icon"><UsersIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalUsers.label}</span>
                            <span className="kpi-val">{data.kpi.totalUsers.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-products">
                        <div className="kpi-icon"><ShoppingBagIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalProducts.label}</span>
                            <span className="kpi-val">{data.kpi.totalProducts.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-orders">
                        <div className="kpi-icon"><ShoppingCartIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalOrders.label}</span>
                            <span className="kpi-val">{data.kpi.totalOrders.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-revenue">
                        <div className="kpi-icon"><CurrencyDollarIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalRevenue.label}</span>
                            <span className="kpi-val">{formatCurrency(data.kpi.totalRevenue.value)}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-reviews">
                        <div className="kpi-icon"><StarIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalReviews.label}</span>
                            <span className="kpi-val">{data.kpi.totalReviews.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-wishlist">
                        <div className="kpi-icon"><HeartIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.totalWishlists.label}</span>
                            <span className="kpi-val">{data.kpi.totalWishlists.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-today">
                        <div className="kpi-icon"><CalendarDaysIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.todayOrders.label}</span>
                            <span className="kpi-val">{data.kpi.todayOrders.value}</span>
                        </div>
                    </div>
                    <div className="kpi-card color-canceled">
                        <div className="kpi-icon"><XCircleIcon className="w-6 h-6" /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">{data.kpi.canceledOrders.label}</span>
                            <span className="kpi-val">{data.kpi.canceledOrders.value}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Charts Row */}
            <div className="db-charts-row">
                <div className="db-card chart-revenue">
                    <h3>📈 Doanh thu ({dateRange})</h3>
                    <div className="chart-wrapper"><Line data={lineChartData} options={lineOptions} /></div>
                </div>
                <div className="db-card chart-status">
                    <h3>🍩 Trạng thái đơn hàng</h3>
                    <div className="chart-wrapper"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
                </div>
            </div>

            {/* 3. Top Products & Categories Row */}
            <div className="db-grid-2">
                <div className="db-card">
                    <div className="card-header">
                        <h3>🏆 Sản phẩm Handmade Bán Chạy</h3>
                        <button className="view-all">Xem thêm <ArrowRightIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="table-responsive">
                        <table className="db-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Đã bán</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topProducts.map((p, i) => (
                                    <tr key={i}>
                                        <td className="td-product">
                                            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="no-img"></div>}
                                            <span>{p.name}</span>
                                        </td>
                                        <td>{p.category_name || 'Khác'}</td>
                                        <td><strong>{p.sold}</strong></td>
                                        <td className="text-purple">{formatCurrency(p.revenue)}</td>
                                    </tr>
                                ))}
                                {data.topProducts.length === 0 && <tr><td colSpan={4} className="text-center">Chưa có dữ liệu</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="db-card">
                    <h3>📊 Danh mục Bán Chạy Nhất</h3>
                    <div className="chart-wrapper"><Bar data={barData} options={barOptions} /></div>
                </div>
            </div>

            {/* 4. Recent Orders & Activities Row */}
            <div className="db-grid-2">
                <div className="db-card">
                    <div className="card-header">
                        <h3>🛒 Đơn hàng mới</h3>
                        <button className="view-all">Xem tất cả <ArrowRightIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="table-responsive">
                        <table className="db-table">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Khách hàng</th>
                                    <th>Giá trị</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.map((o, i) => (
                                    <tr key={i}>
                                        <td>#{o.order_id}</td>
                                        <td>{o.customer_name}</td>
                                        <td>{formatCurrency(o.total_value)}</td>
                                        <td><span className="badge-status" style={{ backgroundColor: mapStatusColor(o.status) + '20', color: mapStatusColor(o.status) }}>{o.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="db-card">
                    <h3>⚡ Hoạt động gần đây</h3>
                    <div className="timeline">
                        {data.activities.map((act, i) => (
                            <div key={i} className="timeline-item">
                                <div className={`timeline-icon type-${act.type}`}>
                                    {act.type === 'order' && <ShoppingCartIcon className="w-4 h-4" />}
                                    {act.type === 'user' && <UsersIcon className="w-4 h-4" />}
                                    {act.type === 'review' && <StarIcon className="w-4 h-4" />}
                                </div>
                                <div className="timeline-content">
                                    <p>{act.content}</p>
                                    <span className="time"><ClockIcon className="w-3 h-3" /> {new Date(act.time).toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                        ))}
                        {data.activities.length === 0 && <p className="text-center text-gray-500">Chưa có hoạt động nào</p>}
                    </div>
                </div>
            </div>

            {/* 5. Lower Row: New Users, Low Stock, Reviews */}
            <div className="db-grid-3">
                <div className="db-card">
                    <h3>🆕 Người dùng mới</h3>
                    <div className="list-group">
                        {data.newUsers.map((u, i) => (
                            <div key={i} className="list-item">
                                <div className="avatar">{u.full_name.charAt(0).toUpperCase()}</div>
                                <div className="list-info">
                                    <strong>{u.full_name}</strong>
                                    <span>{u.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="db-card">
                    <h3>⚠️ Sản phẩm sắp hết</h3>
                    <div className="list-group">
                        {data.lowStock.map((s, i) => (
                            <div key={i} className="list-item flex-between">
                                <div className="list-info">
                                    <strong>{s.product_name}</strong>
                                    <span>SKU: {s.sku}</span>
                                </div>
                                <span className="badge-danger">{s.inventory} SP</span>
                            </div>
                        ))}
                        {data.lowStock.length === 0 && <p className="text-center text-green-500 mt-4">Kho hàng an toàn</p>}
                    </div>
                </div>

                <div className="db-card">
                    <h3>⭐ Đánh giá mới</h3>
                    <div className="list-group">
                        {data.recentReviews.map((r, i) => (
                            <div key={i} className="review-item">
                                <div className="stars">
                                    {Array(r.stars).fill(0).map((_, idx) => <StarIcon key={idx} className="w-4 h-4 fill-yellow text-yellow-400" />)}
                                </div>
                                <p>"{r.content}"</p>
                                <span>- {r.customer_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;