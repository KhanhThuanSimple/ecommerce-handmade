import React, { useState } from 'react';
import {
    BuildingStorefrontIcon,
    CreditCardIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    BellIcon,
    LanguageIcon,
    PaintBrushIcon,
    KeyIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';

interface SettingsSection {
    id: string;
    name: string;
    icon: React.ElementType;
}

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('general');
    const [saving, setSaving] = useState(false);
    const notify = useNotify();

    // General Settings
    const [generalSettings, setGeneralSettings] = useState({
        storeName: 'Handmade Vietnam',
        storeEmail: 'contact@handmade.vn',
        storePhone: '1900 1234',
        storeAddress: '123 Đường Láng, Đống Đa, Hà Nội',
        taxRate: 10,
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
    });

    // Payment Settings
    const [paymentSettings, setPaymentSettings] = useState({
        codEnabled: true,
        bankingEnabled: true,
        momoEnabled: false,
        bankName: 'Vietcombank',
        bankAccount: '1234567890',
        bankHolder: 'Handmade Vietnam',
    });

    // Email Settings
    const [emailSettings, setEmailSettings] = useState({
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@handmade.vn',
        smtpPassword: '********',
        orderConfirmation: true,
        paymentConfirmation: true,
        shippingUpdate: true,
        newsletterEnabled: true,
    });

    // Security Settings
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        maxLoginAttempts: 5,
        ipWhitelist: '',
    });

    // Notification Settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        orderCreated: true,
        orderCancelled: true,
        lowStock: true,
        newUser: false,
    });

    const sections: SettingsSection[] = [
        { id: 'general', name: 'Thông tin chung', icon: BuildingStorefrontIcon },
        { id: 'payment', name: 'Thanh toán', icon: CreditCardIcon },
        { id: 'email', name: 'Email', icon: EnvelopeIcon },
        { id: 'security', name: 'Bảo mật', icon: ShieldCheckIcon },
        { id: 'notification', name: 'Thông báo', icon: BellIcon },
        { id: 'appearance', name: 'Giao diện', icon: PaintBrushIcon },
        { id: 'api', name: 'API Keys', icon: KeyIcon },
        { id: 'profile', name: 'Hồ sơ', icon: UserCircleIcon },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            // API calls to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));
            notify.success('Đã lưu cài đặt thành công');
        } catch (error) {
            notify.error('Lưu cài đặt thất bại');
        } finally {
            setSaving(false);
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h3>Thông tin cửa hàng</h3>
                            <p>Cấu hình thông tin cơ bản của cửa hàng</p>
                        </div>
                        <div className="section-body">
                            <div className="setting-field">
                                <label className="setting-label">Tên cửa hàng</label>
                                <input 
                                    type="text" 
                                    className="setting-input"
                                    value={generalSettings.storeName}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                                />
                            </div>
                            
                            <div className="setting-field">
                                <label className="setting-label">Email liên hệ</label>
                                <input 
                                    type="email" 
                                    className="setting-input"
                                    value={generalSettings.storeEmail}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })}
                                />
                            </div>
                            
                            <div className="setting-field">
                                <label className="setting-label">Số điện thoại</label>
                                <input 
                                    type="tel" 
                                    className="setting-input"
                                    value={generalSettings.storePhone}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })}
                                />
                            </div>
                            
                            <div className="setting-field">
                                <label className="setting-label">Địa chỉ</label>
                                <textarea 
                                    className="setting-input"
                                    rows={3}
                                    value={generalSettings.storeAddress}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, storeAddress: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="setting-field">
                                    <label className="setting-label">Thuế suất (%)</label>
                                    <input 
                                        type="number" 
                                        className="setting-input"
                                        value={generalSettings.taxRate}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: Number(e.target.value) })}
                                    />
                                </div>
                                
                                <div className="setting-field">
                                    <label className="setting-label">Đơn vị tiền tệ</label>
                                    <select 
                                        className="setting-select"
                                        value={generalSettings.currency}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                                    >
                                        <option value="VND">VND - Việt Nam Đồng</option>
                                        <option value="USD">USD - US Dollar</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                
            case 'payment':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h3>Cổng thanh toán</h3>
                            <p>Cấu hình phương thức thanh toán</p>
                        </div>
                        <div className="section-body">
                            <div className="setting-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label className="setting-label">Thanh toán khi nhận hàng (COD)</label>
                                        <p className="setting-description">Cho phép khách hàng thanh toán khi nhận hàng</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={paymentSettings.codEnabled}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, codEnabled: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="setting-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label className="setting-label">Chuyển khoản ngân hàng</label>
                                        <p className="setting-description">Cho phép thanh toán qua chuyển khoản ngân hàng</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={paymentSettings.bankingEnabled}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, bankingEnabled: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            {paymentSettings.bankingEnabled && (
                                <>
                                    <div className="setting-field">
                                        <label className="setting-label">Ngân hàng</label>
                                        <input 
                                            type="text" 
                                            className="setting-input"
                                            value={paymentSettings.bankName}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                                        />
                                    </div>
                                    
                                    <div className="setting-field">
                                        <label className="setting-label">Số tài khoản</label>
                                        <input 
                                            type="text" 
                                            className="setting-input"
                                            value={paymentSettings.bankAccount}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccount: e.target.value })}
                                        />
                                    </div>
                                    
                                    <div className="setting-field">
                                        <label className="setting-label">Chủ tài khoản</label>
                                        <input 
                                            type="text" 
                                            className="setting-input"
                                            value={paymentSettings.bankHolder}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, bankHolder: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div className="setting-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label className="setting-label">Ví Momo</label>
                                        <p className="setting-description">Thanh toán qua ví điện tử Momo</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={paymentSettings.momoEnabled}
                                            onChange={(e) => setPaymentSettings({ ...paymentSettings, momoEnabled: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                
            case 'security':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h3>Cài đặt bảo mật</h3>
                            <p>Cấu hình bảo mật cho hệ thống</p>
                        </div>
                        <div className="section-body">
                            <div className="setting-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <label className="setting-label">Xác thực 2 yếu tố (2FA)</label>
                                        <p className="setting-description">Tăng cường bảo mật cho tài khoản admin</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={securitySettings.twoFactorAuth}
                                            onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="setting-field">
                                    <label className="setting-label">Thời gian session (phút)</label>
                                    <input 
                                        type="number" 
                                        className="setting-input"
                                        value={securitySettings.sessionTimeout}
                                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })}
                                    />
                                </div>
                                
                                <div className="setting-field">
                                    <label className="setting-label">Thời hạn mật khẩu (ngày)</label>
                                    <input 
                                        type="number" 
                                        className="setting-input"
                                        value={securitySettings.passwordExpiry}
                                        onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            
                            <div className="setting-field">
                                <label className="setting-label">Số lần đăng nhập sai tối đa</label>
                                <input 
                                    type="number" 
                                    className="setting-input"
                                    value={securitySettings.maxLoginAttempts}
                                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: Number(e.target.value) })}
                                />
                                <p className="setting-description">Khóa tài khoản sau số lần đăng nhập sai này</p>
                            </div>
                            
                            <div className="setting-field">
                                <label className="setting-label">IP Whitelist</label>
                                <textarea 
                                    className="setting-input"
                                    rows={3}
                                    placeholder="Nhập các IP được phép, mỗi IP trên một dòng"
                                    value={securitySettings.ipWhitelist}
                                    onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                                />
                                <p className="setting-description">Chỉ cho phép truy cập từ các IP này (để trống để cho phép tất cả)</p>
                            </div>
                        </div>
                        
                        <div className="danger-zone">
                            <div className="danger-header">
                                <h3>⚠️ Vùng nguy hiểm</h3>
                            </div>
                            <div className="danger-body">
                                <p>Reset tất cả cài đặt về mặc định. Hành động này không thể hoàn tác.</p>
                                <button 
                                    className="danger-btn"
                                    onClick={() => {
                                        if (window.confirm('Bạn có chắc chắn muốn reset tất cả cài đặt?')) {
                                            notify.warning('Đã reset cài đặt về mặc định');
                                        }
                                    }}
                                >
                                    Reset cài đặt
                                </button>
                            </div>
                        </div>
                    </div>
                );
                
            default:
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h3>Đang phát triển</h3>
                            <p>Tính năng đang được cập nhật</p>
                        </div>
                        <div className="section-body">
                            <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
                                <div className="empty-state-icon">🚧</div>
                                <div className="empty-state-title">Đang xây dựng</div>
                                <div className="empty-state-description">Tính năng này sẽ sớm được cập nhật</div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="settings-container">
            {/* Header */}
            <div className="settings-header">
                <h1 className="settings-title">
                    ⚙️ Cài Đặt Hệ Thống
                </h1>
                <p className="settings-subtitle">
                    Cấu hình thông tin cửa hàng, thanh toán, bảo mật và các tùy chỉnh khác
                </p>
            </div>

            {/* Settings Layout */}
            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    <div className="settings-nav">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <section.icon className="settings-nav-icon" />
                                <span className="settings-nav-text">{section.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="settings-content">
                    {renderSection()}
                    
                    {/* Save Button */}
                    <div className="save-settings">
                        <button 
                            className="save-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;