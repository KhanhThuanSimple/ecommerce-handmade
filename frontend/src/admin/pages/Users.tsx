import React, { useState, useEffect } from 'react';
import '../styles/admin.css';

import { UserCircleIcon } from '@heroicons/react/24/outline';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'vip';
    status: 'active' | 'inactive';
    orders: number;
    totalSpent: number;
    joinDate: string;
}

const Users = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);

    useEffect(() => {
        setUsers([
            {
                id: 1,
                name: 'Nguyễn Thị Hoa',
                email: 'hoa.nguyen@email.com',
                phone: '0901234567',
                role: 'user',
                status: 'active',
                orders: 5,
                totalSpent: 12500000,
                joinDate: '2025-06-15'
            },
            {
                id: 2,
                name: 'Trần Văn Lộc',
                email: 'loc.tran@email.com',
                phone: '0912345678',
                role: 'user',
                status: 'active',
                orders: 3,
                totalSpent: 6780000,
                joinDate: '2025-08-22'
            },
            {
                id: 3,
                name: 'Lê Thị Xuân',
                email: 'xuan.le@email.com',
                phone: '0923456789',
                role: 'vip',
                status: 'active',
                orders: 12,
                totalSpent: 45600000,
                joinDate: '2025-03-10'
            }
        ]);
    }, []);

    const toggleStatus = (userId: number) => {
        setUsers(
            users.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          status:
                              user.status === 'active'
                                  ? 'inactive'
                                  : 'active'
                      }
                    : user
            )
        );
    };

    return (
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <span>Quản Lý Người Dùng</span>
                <span className="text-2xl">👥</span>
            </h1>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="stat-card p-6 text-center">
                    <UserCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                        {users.length}
                    </p>
                    <p className="text-gray-500 text-sm">
                        Tổng người dùng
                    </p>
                </div>

                <div className="stat-card p-6 text-center">
                    <UserCircleIcon className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                        {
                            users.filter(
                                (u) => u.role === 'vip'
                            ).length
                        }
                    </p>
                    <p className="text-gray-500 text-sm">
                        Thành viên VIP
                    </p>
                </div>

                <div className="stat-card p-6 text-center">
                    <UserCircleIcon className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                        {
                            users.filter(
                                (u) => u.status === 'active'
                            ).length
                        }
                    </p>
                    <p className="text-gray-500 text-sm">
                        Đang hoạt động
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="admin-table w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs">
                                ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Họ Tên
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                SĐT
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Hạng
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Đơn Hàng
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Chi Tiêu
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Trạng Thái
                            </th>
                            <th className="px-6 py-4 text-left text-xs">
                                Thao Tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-yellow-50/50 transition"
                            >
                                <td className="px-6 py-4 text-sm">
                                    {user.id}
                                </td>

                                <td className="px-6 py-4 text-sm font-medium">
                                    {user.name}
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.email}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {user.phone}
                                </td>

                                <td className="px-6 py-4">
                                    {user.role === 'vip' ? (
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                                            ⭐ VIP
                                        </span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                            Thường
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {user.orders}
                                </td>

                                <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                    {new Intl.NumberFormat(
                                        'vi-VN'
                                    ).format(user.totalSpent)}
                                    đ
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`status-badge ${
                                            user.status === 'active'
                                                ? 'status-active'
                                                : 'status-inactive'
                                        }`}
                                    >
                                        {user.status === 'active'
                                            ? 'Hoạt động'
                                            : 'Khóa'}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <button
                                        onClick={() =>
                                            toggleStatus(user.id)
                                        }
                                        className={`px-3 py-1 rounded-lg text-sm transition ${
                                            user.status === 'active'
                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                                        }`}
                                    >
                                        {user.status === 'active'
                                            ? 'Khóa'
                                            : 'Mở khóa'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;