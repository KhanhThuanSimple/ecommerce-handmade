import React, { useState, ChangeEvent, FormEvent } from 'react';
import '../styles/admin.css';

import {
    Cog6ToothIcon,
    BellIcon,
    ShieldCheckIcon,
    SwatchIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SettingsData {
    siteName: string;
    siteEmail: string;
    sitePhone: string;
    address: string;
    facebook: string;
    instagram: string;
    shippingFee: number;
    freeShippingMin: number;
    tetPromotion: boolean;
    promotionValue: number;
    maintenanceMode: boolean;
}

type TabType =
    | 'general'
    | 'social'
    | 'shipping'
    | 'promotion'
    | 'security';

const Settings = () => {
    const [settings, setSettings] = useState<SettingsData>({
        siteName: 'Handmade Ceramics',
        siteEmail: 'contact@handmade.com',
        sitePhone: '1900 1234',
        address: '123 Đường Gốm Sứ, Quận Hoàn Kiếm, Hà Nội',
        facebook: 'https://facebook.com/handmade',
        instagram: 'https://instagram.com/handmade',
        shippingFee: 30000,
        freeShippingMin: 1500000,
        tetPromotion: true,
        promotionValue: 15,
        maintenanceMode: false
    });

    const [activeTab, setActiveTab] = useState<TabType>('general');

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        const checked =
            e.target instanceof HTMLInputElement
                ? e.target.checked
                : false;

        setSettings((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? checked
                    : type === 'number'
                    ? Number(value)
                    : value
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        localStorage.setItem(
            'adminSettings',
            JSON.stringify(settings)
        );

        alert('Đã lưu cài đặt thành công!');
    };

    const tabs: {
        id: TabType;
        name: string;
        icon: React.ElementType;
    }[] = [
        { id: 'general', name: 'Thông tin chung', icon: Cog6ToothIcon },
        { id: 'social', name: 'Mạng xã hội', icon: GlobeAltIcon },
        { id: 'shipping', name: 'Vận chuyển', icon: BellIcon },
        { id: 'promotion', name: 'Khuyến mãi Tết', icon: SwatchIcon },
        { id: 'security', name: 'Bảo mật', icon: ShieldCheckIcon }
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>Cài Đặt Hệ Thống</span>
                    <span className="text-2xl">⚙️</span>
                </h1>

                <p className="text-gray-500 mt-1">
                    Cấu hình thông tin cửa hàng và các chương trình khuyến mãi
                </p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                                    activeTab === tab.id
                                        ? 'bg-red-50 text-red-700 border-r-4 border-red-600'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <tab.icon className="h-5 w-5" />

                                <span className="text-sm font-medium">
                                    {tab.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl shadow-sm p-6"
                    >
                        {/* General */}
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">
                                    Thông tin cửa hàng
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tên cửa hàng
                                    </label>

                                    <input
                                        type="text"
                                        name="siteName"
                                        value={settings.siteName}
                                        onChange={handleChange}
                                        className="admin-input w-full px-4 py-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Email liên hệ
                                        </label>

                                        <input
                                            type="email"
                                            name="siteEmail"
                                            value={settings.siteEmail}
                                            onChange={handleChange}
                                            className="admin-input w-full px-4 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Số điện thoại
                                        </label>

                                        <input
                                            type="text"
                                            name="sitePhone"
                                            value={settings.sitePhone}
                                            onChange={handleChange}
                                            className="admin-input w-full px-4 py-2"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Địa chỉ
                                    </label>

                                    <textarea
                                        name="address"
                                        value={settings.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="admin-input w-full px-4 py-2"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Social */}
                        {activeTab === 'social' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">
                                    Mạng xã hội
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Facebook
                                    </label>

                                    <input
                                        type="url"
                                        name="facebook"
                                        value={settings.facebook}
                                        onChange={handleChange}
                                        className="admin-input w-full px-4 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Instagram
                                    </label>

                                    <input
                                        type="url"
                                        name="instagram"
                                        value={settings.instagram}
                                        onChange={handleChange}
                                        className="admin-input w-full px-4 py-2"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Shipping */}
                        {activeTab === 'shipping' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">
                                    Cài đặt vận chuyển
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Phí vận chuyển (VNĐ)
                                        </label>

                                        <input
                                            type="number"
                                            name="shippingFee"
                                            value={settings.shippingFee}
                                            onChange={handleChange}
                                            className="admin-input w-full px-4 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Miễn phí ship (VNĐ)
                                        </label>

                                        <input
                                            type="number"
                                            name="freeShippingMin"
                                            value={settings.freeShippingMin}
                                            onChange={handleChange}
                                            className="admin-input w-full px-4 py-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Promotion */}
                        {activeTab === 'promotion' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">
                                    Khuyến mãi Tết Bính Ngọ 2026
                                </h3>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="tetPromotion"
                                        checked={settings.tetPromotion}
                                        onChange={handleChange}
                                        className="w-5 h-5"
                                    />

                                    <label className="text-sm font-medium">
                                        Kích hoạt chương trình khuyến mãi Tết
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Giá trị giảm giá (%)
                                    </label>

                                    <input
                                        type="number"
                                        name="promotionValue"
                                        value={settings.promotionValue}
                                        onChange={handleChange}
                                        className="admin-input w-48 px-4 py-2"
                                    />
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <p className="text-sm text-yellow-800">
                                        🧧 Chương trình khuyến mãi Tết sẽ tự động
                                        áp dụng cho đơn hàng từ 500.000đ
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {activeTab === 'security' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">
                                    Bảo mật hệ thống
                                </h3>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="maintenanceMode"
                                        checked={settings.maintenanceMode}
                                        onChange={handleChange}
                                        className="w-5 h-5"
                                    />

                                    <label className="text-sm font-medium">
                                        Chế độ bảo trì (chỉ Admin mới truy cập
                                        được)
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Đổi mật khẩu Admin
                                    </label>

                                    <div className="flex gap-3">
                                        <input
                                            type="password"
                                            placeholder="Mật khẩu mới"
                                            className="admin-input flex-1 px-4 py-2"
                                        />

                                        <button
                                            type="button"
                                            className="admin-btn-primary px-4 py-2"
                                        >
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                className="admin-btn-primary px-6 py-2"
                            >
                                Lưu cài đặt
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;