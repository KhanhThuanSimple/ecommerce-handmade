// admin/pages/Games.tsx
import React, { useState } from 'react';
import {
    GiftIcon,
    TrophyIcon,
    UsersIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

import { Prize } from '../../types/model';

interface Winner {
    id: number;
    name: string;
    prize: string;
    date: string;
    spinCount: number;
}

interface GameStats {
    totalSpins: number;
    totalWinners: number;
    totalGifts: number;
    activePlayers: number;
}

interface GamePrize extends Prize {
    quantity: number;
    remaining: number;
    probability: number;
}

const Games: React.FC = () => {
    const [gameStats] = useState<GameStats>({
        totalSpins: 1250,
        totalWinners: 342,
        totalGifts: 156,
        activePlayers: 89,
    });

    const [winners] = useState<Winner[]>([
        {
            id: 1,
            name: 'Nguyễn Thị Hoa',
            prize: 'Voucher 100.000đ',
            date: '2026-01-15',
            spinCount: 3,
        },
        {
            id: 2,
            name: 'Trần Văn Lộc',
            prize: 'Bộ ấm trà',
            date: '2026-01-14',
            spinCount: 5,
        },
        {
            id: 3,
            name: 'Lê Thị Xuân',
            prize: 'Miễn phí vận chuyển',
            date: '2026-01-14',
            spinCount: 2,
        },
        {
            id: 4,
            name: 'Phạm Văn Thành',
            prize: 'Voucher 50.000đ',
            date: '2026-01-13',
            spinCount: 4,
        },
    ]);

    const [prizes] = useState<GamePrize[]>([
        {
            id: 1,
            name: 'Voucher 100.000đ',
            type: 'voucher',
            value: 100000,
            color: '#F59E0B',
            textColor: '#FFFFFF',
            icon: '🎁',
            description: 'Voucher giảm giá 100.000đ',
            quantity: 50,
            remaining: 32,
            probability: 15,
        },
        {
            id: 2,
            name: 'Voucher 50.000đ',
            type: 'voucher',
            value: 50000,
            color: '#EF4444',
            textColor: '#FFFFFF',
            icon: '🎟️',
            description: 'Voucher giảm giá 50.000đ',
            quantity: 100,
            remaining: 78,
            probability: 25,
        },
        {
            id: 3,
            name: 'Miễn phí vận chuyển',
            type: 'discount',
            value: 100,
            color: '#10B981',
            textColor: '#FFFFFF',
            icon: '🚚',
            description: 'Miễn phí vận chuyển toàn quốc',
            quantity: 200,
            remaining: 156,
            probability: 35,
        },
        {
            id: 4,
            name: 'Bộ ấm trà',
            type: 'none',
            color: '#8B5CF6',
            textColor: '#FFFFFF',
            icon: '🍵',
            description: 'Bộ ấm trà handmade cao cấp',
            quantity: 10,
            remaining: 4,
            probability: 5,
        },
        {
            id: 5,
            name: 'Tượng Ngựa Phong Thủy',
            type: 'none',
            color: '#F97316',
            textColor: '#FFFFFF',
            icon: '🐎',
            description: 'Tượng phong thủy may mắn',
            quantity: 5,
            remaining: 2,
            probability: 2,
        },
        {
            id: 6,
            name: 'Cảm ơn',
            type: 'none',
            color: '#9CA3AF',
            textColor: '#FFFFFF',
            icon: '❤️',
            description: 'Chúc bạn may mắn lần sau',
            quantity: 999,
            remaining: 888,
            probability: 18,
        },
    ]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>Quản Lý Mini Game</span>
                    <span className="text-2xl">🎡</span>
                </h1>

                <p className="text-gray-500 mt-1">
                    Quản lý vòng quay may mắn Tết Bính Ngọ 2026
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="stat-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">
                                Tổng lượt quay
                            </p>
                            <p className="text-2xl font-bold">
                                {gameStats.totalSpins}
                            </p>
                        </div>

                        <GiftIcon className="h-10 w-10 text-yellow-500" />
                    </div>
                </div>

                <div className="stat-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">
                                Người trúng thưởng
                            </p>
                            <p className="text-2xl font-bold">
                                {gameStats.totalWinners}
                            </p>
                        </div>

                        <TrophyIcon className="h-10 w-10 text-yellow-500" />
                    </div>
                </div>

                <div className="stat-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">
                                Quà đã trao
                            </p>
                            <p className="text-2xl font-bold">
                                {gameStats.totalGifts}
                            </p>
                        </div>

                        <UsersIcon className="h-10 w-10 text-yellow-500" />
                    </div>
                </div>

                <div className="stat-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">
                                Đang chơi
                            </p>
                            <p className="text-2xl font-bold">
                                {gameStats.activePlayers}
                            </p>
                        </div>

                        <CalendarIcon className="h-10 w-10 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Prize Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold">
                        Danh Sách Giải Thưởng
                    </h3>
                </div>

                <table className="admin-table w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs">
                                Giải thưởng
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Số lượng
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Còn lại
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Tỷ lệ (%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Trạng thái
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {prizes.map((prize) => (
                            <tr key={prize.id}>
                                <td className="px-6 py-3 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{prize.icon}</span>
                                        <span>{prize.name}</span>
                                    </div>
                                </td>

                                <td className="px-6 py-3 text-sm capitalize">
                                    {prize.type}
                                </td>

                                <td className="px-6 py-3 text-sm">
                                    {prize.quantity}
                                </td>

                                <td className="px-6 py-3 text-sm">
                                    {prize.remaining}
                                </td>

                                <td className="px-6 py-3 text-sm">
                                    {prize.probability}%
                                </td>

                                <td className="px-6 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            prize.remaining > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {prize.remaining > 0
                                            ? 'Còn quà'
                                            : 'Hết quà'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Winners */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold">
                        Người Trúng Thưởng Gần Đây
                    </h3>
                </div>

                <table className="admin-table w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs">
                                Người chơi
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Giải thưởng
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Số lượt quay
                            </th>
                            <th className="px-6 py-3 text-left text-xs">
                                Ngày trúng
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {winners.map((winner) => (
                            <tr key={winner.id}>
                                <td className="px-6 py-3 text-sm font-medium">
                                    {winner.name}
                                </td>

                                <td className="px-6 py-3 text-sm text-yellow-600">
                                    {winner.prize}
                                </td>

                                <td className="px-6 py-3 text-sm">
                                    {winner.spinCount}
                                </td>

                                <td className="px-6 py-3 text-sm">
                                    {winner.date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Games;