// src/admin/pages/SuperDashboard.tsx
import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CreditCardIcon,
    ChartBarIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';
import { useSuperDashboard } from '../../services/useSuperDashboard';
import '../styles/dashboard.css';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// Helper
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
        'Hoàn thành': '#10b981',
        'Đang xử lý': '#3b82f6',
        'Chờ thanh toán': '#f59e0b',
        'Đã hủy': '#ef4444',
    };
    return map[status] || '#6b7280';
};

const Dashboard: React.FC = () => {
    const { data, loading, error, dateRange, setDateRange, refresh } = useSuperDashboard();

    // Chart data
    const lineChartData = {
        labels: data.revenueTrend.map(item => item.date_label),
        datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: data.revenueTrend.map(item => item.daily_revenue),
            borderColor: '#c41e3a',
            backgroundColor: 'rgba(196, 30, 58, 0.05)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
        }],
    };

    const userPieData = {
        labels: data.userDistribution.map(item => item.name),
        datasets: [{
            data: data.userDistribution.map(item => item.value),
            backgroundColor: data.userDistribution.map(item => item.color || '#94a3b8'),
            borderWidth: 0,
        }],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const, labels: { boxWidth: 12 } } },
        scales: { y: { ticks: { callback: (v: any) => formatCurrency(v) } } },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 } } } },
    };

    if (loading) {
        return (
            <div className="super-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner-super"></div>
                    <span>Đang tổng hợp dữ liệu toàn hệ thống...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="super-dashboard">
                <div className="dashboard-error">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 text-red-500" />
                    <h3>{error}</h3>
                    <button onClick={refresh} className="refresh-btn mt-3">Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="super-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1>📊 Super Dashboard · Tổng quan toàn hệ thống</h1>
                    <p>Phân tích doanh thu, quản lý kho, cổng thanh toán & người dùng thời gian thực</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="date-range-selector">
                        <button className={`range-btn ${dateRange === 'today' ? 'active' : ''}`} onClick={() => setDateRange('today')}>Hôm nay</button>
                        <button className={`range-btn ${dateRange === 'month' ? 'active' : ''}`} onClick={() => setDateRange('month')}>30 ngày</button>
                        <button className={`range-btn ${dateRange === 'year' ? 'active' : ''}`} onClick={() => setDateRange('year')}>Năm nay</button>
                    </div>
                    <button className="refresh-btn" onClick={refresh}>
                        <ArrowPathIcon className="w-4 h-4" /> Làm mới
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            {data.kpi && (
                <div className="kpi-grid-super">
                    <div className="kpi-card-super">
                        <div className="kpi-header-super">
                            <span className="kpi-label">{data.kpi.revenue.label}</span>
                            <div className="kpi-icon-super" style={{ background: '#fee2e2' }}><CurrencyDollarIcon className="w-5 h-5 text-red-600" /></div>
                        </div>
                        <div className="kpi-value-super">{formatCurrency(data.kpi.revenue.value)}</div>
                    </div>
                    <div className="kpi-card-super">
                        <div className="kpi-header-super">
                            <span className="kpi-label">{data.kpi.successOrders.label}</span>
                            <div className="kpi-icon-super" style={{ background: '#e0f2fe' }}><ShoppingBagIcon className="w-5 h-5 text-blue-600" /></div>
                        </div>
                        <div className="kpi-value-super">{data.kpi.successOrders.value} đơn</div>
                    </div>
                    <div className="kpi-card-super">
                        <div className="kpi-header-super">
                            <span className="kpi-label">{data.kpi.aov.label}</span>
                            <div className="kpi-icon-super" style={{ background: '#dcfce7' }}><CurrencyDollarIcon className="w-5 h-5 text-green-600" /></div>
                        </div>
                        <div className="kpi-value-super">{formatCurrency(data.kpi.aov.value)}</div>
                    </div>
                    <div className="kpi-card-super">
                        <div className="kpi-header-super">
                            <span className="kpi-label">{data.kpi.conversionRate.label}</span>
                            <div className="kpi-icon-super" style={{ background: '#f3e8ff' }}><UsersIcon className="w-5 h-5 text-purple-600" /></div>
                        </div>
                        <div className="kpi-value-super">{data.kpi.conversionRate.value}%</div>
                    </div>
                </div>
            )}

            {/* 2-column: Revenue Chart + Right Widgets */}
            <div className="dashboard-two-columns">
                {/* Biểu đồ doanh thu */}
                <div className="chart-card-super">
                    <div className="chart-title-super">
                        <ChartBarIcon className="w-5 h-5 text-red-600" />
                        Xu hướng doanh thu theo thời gian
                    </div>
                    <div className="chart-container-super">
                        <Line data={lineChartData} options={lineOptions} />
                    </div>
                </div>

                {/* Right side: Low stock + Payment methods */}
                <div className="right-widgets">
                    {/* Low stock alert */}
                    <div className="widget-card">
                        <div className="widget-title">
                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                            ⚠️ Cảnh báo tồn kho thấp (≤5)
                        </div>
                        <div className="low-stock-list">
                            {data.lowStockAlerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>✅ Hàng hóa dồi dào</div>
                            ) : (
                                data.lowStockAlerts.slice(0, 4).map(item => (
                                    <div key={item.sku} className="low-stock-item">
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '13px' }}>{item.product_name}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.variant_name}</div>
                                        </div>
                                        <span className={`stock-badge-super ${item.inventory === 0 ? 'empty' : 'low'}`}>
                                            {item.inventory === 0 ? 'Hết hàng' : `Còn ${item.inventory}`}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payment methods status */}
                    <div className="widget-card">
                        <div className="widget-title">
                            <CreditCardIcon className="w-4 h-4 text-green-600" />
                            Trạng thái cổng thanh toán
                        </div>
                        <div className="payment-methods-list">
                            {data.paymentMethods.slice(0, 4).map(method => (
                                <div key={method.code} className="payment-method-item">
                                    <span>
                                        <span className={`method-status ${method.is_active ? 'active' : 'inactive'}`}></span>
                                        {method.name}
                                    </span>
                                    <span style={{ fontSize: '11px', color: method.is_active ? '#10b981' : '#ef4444' }}>
                                        {method.is_active ? '● Hoạt động' : '○ Tạm dừng'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3-column: Top products + User distribution + Abandoned cart */}
            <div className="dashboard-three-columns">
                {/* Top products */}
                <div className="table-card">
                    <div className="widget-title">🏆 Top sản phẩm theo doanh thu</div>
                    <table className="simple-table">
                        <thead>
                            <tr><th>#</th><th>Sản phẩm</th><th>Doanh thu</th><th>%</th></tr>
                        </thead>
                        <tbody>
                            {data.topProducts.slice(0, 4).map((p, idx) => (
                                <tr key={p.id}>
                                    <td className="product-rank-cell">#{idx+1}</td>
                                    <td style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                                    <td>{formatCurrency(p.revenue)}</td>
                                    <td>
                                        <div className="revenue-bar-cell">
                                            <div style={{ width: '50px', background: '#e2e8f0', borderRadius: '3px' }}>
                                                <div className="revenue-bar-fill-super" style={{ width: `${p.percentage}%` }}></div>
                                            </div>
                                            <span style={{ fontSize: '11px' }}>{p.percentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* User distribution */}
                <div className="table-card">
                    <div className="widget-title"><UsersIcon className="w-4 h-4 text-blue-600" /> Phân bố người dùng</div>
                    <div className="user-dist-list">
                        {data.userDistribution.length > 0 ? (
                            <>
                                <div className="chart-container-super" style={{ height: '160px' }}>
                                    <Pie data={userPieData} options={pieOptions} />
                                </div>
                                {data.userDistribution.map((item, idx) => (
                                    <div key={idx} className="user-dist-item">
                                        <div className="dist-color" style={{ background: item.color }}></div>
                                        <span className="dist-name">{item.name}</span>
                                        <span className="dist-value">{item.value}</span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* Abandoned cart + Recent orders quick view */}
                <div className="table-card">
                    <div className="widget-title"><TruckIcon className="w-4 h-4 text-amber-600" /> Giỏ hàng bỏ dở & Đơn gần đây</div>
                    {data.abandonedCart && (
                        <div className="abandoned-alert" style={{ margin: '12px 16px', padding: '12px', borderRadius: '12px' }}>
                            <div className="alert-content">
                                <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                                <div className="alert-text">
                                    <strong>{data.abandonedCart.abandonedCartsCount} giỏ hàng</strong> bỏ dở ·{' '}
                                    <strong>{formatCurrency(data.abandonedCart.potentialLossValue)}</strong> cơ hội
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="scrollable-orders">
                        <table className="simple-table">
                            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Trạng thái</th><th>Tiền</th></tr></thead>
                            <tbody>
                                {data.recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td style={{ fontSize: '11px' }}>#{order.id.slice(-6)}</td>
                                        <td>{order.fullName?.split(' ').pop()}</td>
                                        <td>
                                            <span className="order-status-badge-super" style={{ background: `${getStatusClass(order.status)}20`, color: getStatusClass(order.status) }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(order.payableAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;