// admin/pages/Orders.tsx
import React, { useEffect, useState } from 'react';
import '../styles/admin.css';

type OrderStatus = 'pending' | 'shipped' | 'delivered';

interface Order {
    id: string;
    customer: string;
    phone: string;
    total: number;
    status: OrderStatus;
    date: string;
    items: number;
}

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<'all' | OrderStatus>('all');

    useEffect(() => {
        setOrders([
            {
                id: 'ORD2026001',
                customer: 'Nguyễn Thị Hoa',
                phone: '0901234567',
                total: 1250000,
                status: 'delivered',
                date: '2026-01-15',
                items: 3,
            },
            {
                id: 'ORD2026002',
                customer: 'Trần Văn Lộc',
                phone: '0912345678',
                total: 2340000,
                status: 'shipped',
                date: '2026-01-14',
                items: 2,
            },
            {
                id: 'ORD2026003',
                customer: 'Lê Thị Xuân',
                phone: '0923456789',
                total: 890000,
                status: 'pending',
                date: '2026-01-14',
                items: 1,
            },
            {
                id: 'ORD2026004',
                customer: 'Phạm Văn Thành',
                phone: '0934567890',
                total: 3450000,
                status: 'pending',
                date: '2026-01-13',
                items: 4,
            },
            {
                id: 'ORD2026005',
                customer: 'Hoàng Thị Mai',
                phone: '0945678901',
                total: 5670000,
                status: 'shipped',
                date: '2026-01-12',
                items: 5,
            },
        ]);
    }, []);

    const updateStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            )
        );
    };

    const filteredOrders =
        filter === 'all'
            ? orders
            : orders.filter((order) => order.status === filter);

    const getStatusBadge = (status: OrderStatus) => {
        const styles: Record<OrderStatus, string> = {
            pending: 'status-badge status-pending',
            shipped: 'status-badge status-shipped',
            delivered: 'status-badge status-delivered',
        };

        const labels: Record<OrderStatus, string> = {
            pending: 'Chờ xử lý',
            shipped: 'Đang giao',
            delivered: 'Đã giao',
        };

        return (
            <span className={styles[status]}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>Quản Lý Đơn Hàng</span>
                        <span className="text-2xl">📦</span>
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Theo dõi và cập nhật trạng thái đơn hàng
                    </p>
                </div>

                <select
                    value={filter}
                    onChange={(e) =>
                        setFilter(
                            e.target.value as 'all' | OrderStatus
                        )
                    }
                    className="admin-input px-4 py-2"
                >
                    <option value="all">Tất cả đơn hàng</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="shipped">Đang giao</option>
                    <option value="delivered">Đã giao</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="admin-table w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs">
                                Mã Đơn
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Khách Hàng
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                SĐT
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Ngày Đặt
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Số lượng
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Tổng Tiền
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
                        {filteredOrders.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-yellow-50/50 transition"
                            >
                                <td className="px-6 py-4 text-sm font-medium">
                                    {order.id}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {order.customer}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {order.phone}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {order.date}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {order.items}
                                </td>

                                <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        order.total
                                    )}
                                    đ
                                </td>

                                <td className="px-6 py-4">
                                    {getStatusBadge(order.status)}
                                </td>

                                <td className="px-6 py-4">
                                    <select
                                        value={order.status}
                                        onChange={(e) =>
                                            updateStatus(
                                                order.id,
                                                e.target
                                                    .value as OrderStatus
                                            )
                                        }
                                        className="admin-input text-sm px-3 py-1"
                                    >
                                        <option value="pending">
                                            Chờ xử lý
                                        </option>

                                        <option value="shipped">
                                            Đang giao
                                        </option>

                                        <option value="delivered">
                                            Đã giao
                                        </option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="py-10 text-center text-gray-500">
                        Không có đơn hàng nào
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;