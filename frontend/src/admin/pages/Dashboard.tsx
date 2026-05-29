// src/admin/pages/Dashboard.tsx
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
import { Line } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    LockClosedIcon,
    LockOpenIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

// FIX LỖI IMPORT: Thay đổi từ '../services/api' sang đúng file service tập trung trong hooks
import { getAdminUsers, putToggleUserActive, putToggleAdminRole, UserAdminResponse } from '../hooks/adminService';

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
        red: { bg: 'bg-red-50', icon: 'text-red-600' },
        yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
        green: { bg: 'bg-green-50', icon: 'text-green-600' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
        orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${trend < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {trend >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                            {Math.abs(trend)}% so với tháng trước
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color].bg}`}>
                    <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [users, setUsers] = useState<UserAdminResponse[]>([]);
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);

    const [stats, setStats] = useState<DashboardStats>({
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

    const fetchUsers = async (currentPage: number) => {
        setLoading(true);
        try {
            const data = await getAdminUsers(currentPage, 5);
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setStats(prev => ({ ...prev, totalUsers: data.totalElements }));
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
            alert("Không thể tải danh sách thành viên từ máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchUsers(page);
    }, [page]);

    const handleToggleStatus = async (userId: number) => {
        try {
            const message = await putToggleUserActive(userId);
            alert(message);
            void fetchUsers(page);
        } catch (error) {
            alert("Thao tác thất bại!");
        }
    };

    const handleToggleRole = async (userId: number) => {
        try {
            const message = await putToggleAdminRole(userId);
            alert(message);
            void fetchUsers(page);
        } catch (error) {
            alert("Thao tác phân quyền thất bại!");
        }
    };

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

    return (
        <div className="p-6 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <span>Tổng Quan Quản Trị Hệ Thống Tết Bính Ngọ 2026</span>
                    <span className="text-2xl animate-bounce">🐎</span>
                </h1>
                <p className="text-gray-500 mt-1">
                    Hệ thống tích hợp theo dõi doanh thu và Quản lý thành viên (CRM) chuẩn RESTful.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard title="Tổng Sản Phẩm" value={stats.totalProducts} icon={ShoppingBagIcon} trend={12} color="red" />
                <StatCard title="Tổng Đơn Hàng" value={stats.totalOrders} icon={ShoppingCartIcon} trend={stats.ordersGrowth} color="yellow" />
                <StatCard title="Doanh Thu" value={new Intl.NumberFormat('vi-VN').format(stats.totalRevenue) + 'đ'} icon={CurrencyDollarIcon} trend={stats.revenueGrowth} color="green" />
                <StatCard title="Người Dùng Hệ Thống" value={stats.totalUsers} icon={UserGroupIcon} trend={stats.usersGrowth} color="blue" />
                <StatCard title="Đơn Chờ Xử Lý" value={stats.pendingOrders} icon={ShoppingCartIcon} color="orange" />
            </div>

            {/* Charts & Marketing Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-red-600" /> Doanh Thu Theo Tháng
                    </h3>
                    <div className="w-full">
                        <Line data={revenueData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="text-6xl mb-4">🧧</div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Chương Trình Khuyến Mãi Tết</h4>
                    <p className="text-gray-500 mb-6 text-sm">Giảm giá tự động lên đến 30% cho các sản phẩm thủ công mỹ nghệ.</p>
                    <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition">
                        Cấu hình chiến dịch
                    </button>
                </div>
            </div>

            {/* BẢNG QUẢN LÝ THÀNH VIÊN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Quản Lý Thành Viên & Phân Quyền</h3>
                        <p className="text-xs text-gray-400 mt-1">Quản lý trạng thái hoạt động và phân quyền Admin trực tiếp vào cơ sở dữ liệu.</p>
                    </div>
                    {loading && <span className="text-sm text-gray-400 animate-pulse">Đang đồng bộ DB...</span>}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4">ID</th>
                                <th className="p-4">Họ và Tên</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Số điện thoại</th>
                                <th className="p-4">Quyền hạn (Roles)</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4 font-medium text-gray-400">#{user.id}</td>
                                    <td className="p-4 font-semibold text-gray-800">{user.fullName || 'Chưa cập nhật'}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">{user.phone || '---'}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {/* FIX LỖI TS7006: Thêm định kiểu tường minh (: string) cho biến role trong vòng lặp map */}
                                            {user.roles.map((role: string) => (
                                                <span key={role} className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'}`}>
                                                    {role.replace('ROLE_', '')}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${user.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {user.enabled ? 'Đang hoạt động' : 'Đang bị khóa'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button 
                                                onClick={() => handleToggleStatus(user.id)}
                                                title={user.enabled ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                className={`p-1.5 rounded-lg border transition ${user.enabled ? 'text-red-600 hover:bg-red-50 border-red-100' : 'text-green-600 hover:bg-green-50 border-green-100'}`}
                                            >
                                                {user.enabled ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
                                            </button>

                                            <button 
                                                onClick={() => handleToggleRole(user.id)}
                                                title="Thay đổi quyền Admin"
                                                className="p-1.5 rounded-lg border text-purple-600 hover:bg-purple-50 border-purple-100 transition"
                                            >
                                                <ShieldCheckIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                    <span>Trang {page + 1} trên tổng số {totalPages} trang</span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 0} 
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <button 
                            disabled={page >= totalPages - 1} 
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;