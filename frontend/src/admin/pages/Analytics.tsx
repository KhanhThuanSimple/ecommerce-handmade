import React, { useState, useEffect } from 'react';
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
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentArrowDownIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

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

interface KPIData {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    customers: { value: number; change: number };
    conversion: { value: number; change: number };
}

interface TopProduct {
    id: number;
    name: string;
    revenue: number;
    quantity: number;
    percentage: number;
}

const Analytics: React.FC = () => {
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
    const [kpiData, setKpiData] = useState<KPIData>({
        revenue: { value: 125000000, change: 23.5 },
        orders: { value: 128, change: 15.2 },
        customers: { value: 342, change: 8.7 },
        conversion: { value: 3.2, change: -1.5 },
    });

    const [topProducts] = useState<TopProduct[]>([
        { id: 1, name: 'Bộ ấm trà gốm sứ', revenue: 42500000, quantity: 50, percentage: 34 },
        { id: 2, name: 'Tượng Ngựa Phong Thủy', revenue: 28000000, quantity: 70, percentage: 22.4 },
        { id: 3, name: 'Tranh thêu tay', revenue: 23500000, quantity: 13, percentage: 18.8 },
        { id: 4, name: 'Vòng tay handmade', revenue: 18900000, quantity: 450, percentage: 15.1 },
        { id: 5, name: 'Nón lá bài thơ', revenue: 12100000, quantity: 80, percentage: 9.7 },
    ]);

    // Revenue chart data
    const revenueChartData = {
        labels: ['Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1'],
        datasets: [
            {
                label: 'Doanh thu 2025-2026',
                data: [85000000, 92000000, 108000000, 125000000, 142000000, 168000000],
                borderColor: '#c41e3a',
                backgroundColor: 'rgba(196, 30, 58, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    // Orders chart data
    const ordersChartData = {
        labels: ['Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1'],
        datasets: [
            {
                label: 'Số đơn hàng',
                data: [65, 72, 88, 95, 108, 128],
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    // Category distribution
    const categoryData = {
        labels: ['Đồ gốm sứ', 'Tranh thêu', 'Trang sức', 'Đồ gỗ', 'Khác'],
        datasets: [
            {
                data: [35, 25, 20, 12, 8],
                backgroundColor: ['#c41e3a', '#f59e0b', '#8b5cf6', '#10b981', '#6b7280'],
                borderWidth: 0,
            },
        ],
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    return (
        <div className="analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <h1 className="analytics-title">
                    📊 Thống Kê & Báo Cáo
                </h1>
                <p className="analytics-subtitle">
                    Phân tích dữ liệu bán hàng và hiệu suất kinh doanh
                </p>
            </div>

            {/* Date Range Picker */}
            <div className="date-range-picker">
                <div className="range-buttons">
                    <button 
                        className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
                        onClick={() => setDateRange('week')}
                    >
                        7 ngày
                    </button>
                    <button 
                        className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
                        onClick={() => setDateRange('month')}
                    >
                        Tháng này
                    </button>
                    <button 
                        className={`range-btn ${dateRange === 'quarter' ? 'active' : ''}`}
                        onClick={() => setDateRange('quarter')}
                    >
                        Quý này
                    </button>
                    <button 
                        className={`range-btn ${dateRange === 'year' ? 'active' : ''}`}
                        onClick={() => setDateRange('year')}
                    >
                        Năm nay
                    </button>
                </div>
                <div className="export-buttons">
                    <button className="export-btn">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Tổng doanh thu</span>
                        <div className="kpi-icon revenue">
                            <CurrencyDollarIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="kpi-value">{formatCurrency(kpiData.revenue.value)}</div>
                    <div className={`kpi-change ${kpiData.revenue.change >= 0 ? 'positive' : 'negative'}`}>
                        {kpiData.revenue.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {Math.abs(kpiData.revenue.change)}% so với kỳ trước
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Tổng đơn hàng</span>
                        <div className="kpi-icon orders">
                            <ShoppingBagIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpiData.orders.value}</div>
                    <div className={`kpi-change ${kpiData.orders.change >= 0 ? 'positive' : 'negative'}`}>
                        {kpiData.orders.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {Math.abs(kpiData.orders.change)}% so với kỳ trước
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Khách hàng mới</span>
                        <div className="kpi-icon customers">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpiData.customers.value}</div>
                    <div className={`kpi-change ${kpiData.customers.change >= 0 ? 'positive' : 'negative'}`}>
                        {kpiData.customers.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {Math.abs(kpiData.customers.change)}% so với kỳ trước
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Tỷ lệ chuyển đổi</span>
                        <div className="kpi-icon conversion">
                            <ChartBarIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="kpi-value">{kpiData.conversion.value}%</div>
                    <div className={`kpi-change ${kpiData.conversion.change >= 0 ? 'positive' : 'negative'}`}>
                        {kpiData.conversion.change >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {Math.abs(kpiData.conversion.change)}% so với kỳ trước
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                <div className="chart-card full-width">
                    <div className="chart-title">
                        <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                        Biểu đồ doanh thu theo tháng
                    </div>
                    <div className="chart-container">
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">
                        <ShoppingBagIcon className="w-5 h-5 text-purple-600" />
                        Số lượng đơn hàng
                    </div>
                    <div className="chart-container">
                        <Bar data={ordersChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">
                        <ChartBarIcon className="w-5 h-5 text-orange-600" />
                        Phân bố danh mục sản phẩm
                    </div>
                    <div className="chart-container">
                        <Pie data={categoryData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="top-products-section">
                <div className="section-header">
                    <h3 className="section-title">Sản phẩm bán chạy nhất</h3>
                    <a href="/admin/products" className="view-all-link">Xem tất cả →</a>
                </div>
                <table className="top-products-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Sản phẩm</th>
                            <th>Số lượng bán</th>
                            <th>Doanh thu</th>
                            <th>% doanh thu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topProducts.map((product, index) => (
                            <tr key={product.id}>
                                <td className="product-rank">#{index + 1}</td>
                                <td>
                                    <div className="product-info-cell">
                                        <div className="product-thumb">
                                            {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📦'}
                                        </div>
                                        <span className="product-name-cell">{product.name}</span>
                                    </div>
                                </td>
                                <td>{product.quantity}</td>
                                <td>{formatCurrency(product.revenue)}</td>
                                <td>
                                    <div className="revenue-bar">
                                        <div 
                                            className="revenue-bar-fill" 
                                            style={{ width: `${product.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>
                                        {product.percentage}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analytics;