// admin/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    pendingOrders: number;
    lowStock: number;
    revenueGrowth: number;
    ordersGrowth: number;
    usersGrowth: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    color: 'red' | 'yellow' | 'green' | 'blue' | 'orange' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
    const colorClasses = {
        red: { bg: 'bg-red-50', icon: 'text-red-600', trend: 'text-green-600' },
        yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', trend: 'text-green-600' },
        green: { bg: 'bg-green-50', icon: 'text-green-600', trend: 'text-green-600' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', trend: 'text-green-600' },
        orange: { bg: 'bg-orange-50', icon: 'text-orange-600', trend: 'text-green-600' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600', trend: 'text-green-600' },
    };

    return (
        <div className="stat-card">
            <div className="flex justify-between items-start">
                <div>
                    <p className="stat-title">{title}</p>
                    <p className="stat-value">{value}</p>
                    {trend !== undefined && (
                        <div className={`stat-trend ${trend < 0 ? 'down' : ''}`}>
                            {trend >= 0 ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                            )}
                            {Math.abs(trend)}% so với tháng trước
                        </div>
                    )}
                </div>
                <div className={`stat-icon-wrapper ${colorClasses[color].bg}`}>
                    <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [stats] = useState<DashboardStats>({
        totalProducts: 45,
        totalOrders: 128,
        totalRevenue: 125000000,
        totalUsers: 342,
        pendingOrders: 15,
        lowStock: 8,
        revenueGrowth: 34,
        ordersGrowth: 23,
        usersGrowth: 18,
    });

    const revenueData = {
        labels: ['Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1'],
        datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: [85000000, 92000000, 108000000, 125000000, 142000000, 168000000],
            borderColor: '#C41E3A',
            backgroundColor: 'rgba(196, 30, 58, 0.1)',
            tension: 0.4,
            fill: true,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>Tổng Quan Tết Bính Ngọ 2026</span>
                    <span className="text-2xl animate-bounce">🐎</span>
                </h1>
                <p className="text-gray-500 mt-1">
                    Chào đón năm mới - Mã đáo thành công, vạn sự như ý
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                    title="Tổng Sản Phẩm"
                    value={stats.totalProducts}
                    icon={ShoppingBagIcon}
                    trend={12}
                    color="red"
                />
                <StatCard
                    title="Tổng Đơn Hàng"
                    value={stats.totalOrders}
                    icon={ShoppingCartIcon}
                    trend={stats.ordersGrowth}
                    color="yellow"
                />
                <StatCard
                    title="Doanh Thu"
                    value={new Intl.NumberFormat('vi-VN').format(stats.totalRevenue) + 'đ'}
                    icon={CurrencyDollarIcon}
                    trend={stats.revenueGrowth}
                    color="green"
                />
                <StatCard
                    title="Người Dùng"
                    value={stats.totalUsers}
                    icon={UserGroupIcon}
                    trend={stats.usersGrowth}
                    color="blue"
                />
                <StatCard
                    title="Đơn Chờ Xử Lý"
                    value={stats.pendingOrders}
                    icon={ShoppingCartIcon}
                    color="orange"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="chart-container">
                    <h3 className="chart-title">
                        <ArrowTrendingUpIcon />
                        Doanh Thu Theo Tháng
                    </h3>
                    <Line data={revenueData} options={chartOptions} />
                </div>

                <div className="chart-container">
                    <h3 className="chart-title">
                        <GiftIcon />
                        Chương Trình Khuyến Mãi Tết
                    </h3>
                    <div className="p-6 text-center">
                        <div className="text-6xl mb-4">🧧</div>
                        <h4 className="text-lg font-semibold mb-2">Giảm giá lên đến 30%</h4>
                        <p className="text-gray-500 mb-4">Cho đơn hàng từ 2 triệu</p>
                        <button className="btn btn-primary">
                            Xem Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;