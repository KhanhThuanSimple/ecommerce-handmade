import React, { useState, useEffect, useCallback } from 'react';
import {
    TicketIcon,
    CreditCardIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
    TagIcon,
    GiftIcon,
    ShieldCheckIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import '../../admin/styles/analytics.css';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
interface Voucher {
    id: string;
    code: string;
    title: string;
    type: string;       // PERCENT | FIXED
    value: number;
    maxDiscount?: number;
    minOrder: number;
    quantity: number;
    used: number;
    target: string;     // ALL | SPECIFIC_USER | LUCKY_WHEEL
    userId?: number | null;
    status: string;     // ACTIVE | INACTIVE | EXPIRED
    startDate: string;
    expiredAt: string;
}

interface VoucherForm {
    id: string;
    code: string;
    title: string;
    type: string;
    value: string;
    maxDiscount: string;
    minOrder: string;
    quantity: string;
    target: string;
    userId: string;
    status: string;
    startDate: string;
    expiredAt: string;
}

interface PaymentMethodAdmin {
    code: string;
    name: string;
    is_active: boolean;
    logoUrl?: string;
    description?: string;
    updated_at?: string;
}

const BLANK_FORM: VoucherForm = {
    id: '', code: '', title: '', type: 'PERCENT', value: '',
    maxDiscount: '', minOrder: '', quantity: '', target: 'ALL',
    userId: '', status: 'ACTIVE',
    startDate: new Date().toISOString().slice(0, 10),
    expiredAt: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
};

// ────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        ACTIVE:   { label: 'Đang hoạt động', cls: 'badge-active',   icon: <CheckCircleIcon className="w-3 h-3" /> },
        INACTIVE: { label: 'Tạm dừng',       cls: 'badge-inactive', icon: <ExclamationCircleIcon className="w-3 h-3" /> },
        EXPIRED:  { label: 'Hết hạn',         cls: 'badge-expired',  icon: <ClockIcon className="w-3 h-3" /> },
    };
    const d = map[status] ?? { label: status, cls: 'badge-inactive', icon: null };
    return <span className={`v-badge ${d.cls}`}>{d.icon}{d.label}</span>;
};

const TypeBadge: React.FC<{ type: string; value: number }> = ({ type, value }) => (
    type === 'PERCENT'
        ? <span className="v-type-badge percent"><TagIcon className="w-3 h-3" />{value}%</span>
        : <span className="v-type-badge fixed"><BanknotesIcon className="w-3 h-3" />{value.toLocaleString('vi-VN')}₫</span>
);

const TargetBadge: React.FC<{ target: string }> = ({ target }) => {
    const map: Record<string, string> = {
        ALL: 'Tất cả', SPECIFIC_USER: 'Cá nhân', LUCKY_WHEEL: 'Vòng quay',
    };
    return <span className="v-target">{map[target] ?? target}</span>;
};

const UsageBar: React.FC<{ used: number; total: number }> = ({ used, total }) => {
    const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const cls = pct >= 90 ? 'danger' : pct >= 60 ? 'warn' : 'ok';
    return (
        <div className="usage-wrap">
            <div className="usage-bar"><div className={`usage-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
            <span className="usage-txt">{used}/{total}</span>
        </div>
    );
};

const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
};

const generateId = () => 'VC-' + Date.now().toString(36).toUpperCase();

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
const Analytics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'voucher' | 'payment'>('voucher');

    // ── VOUCHER STATE ──
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [vLoading, setVLoading] = useState(false);
    const [vSearch, setVSearch] = useState('');
    const [vFilterStatus, setVFilterStatus] = useState('ALL');
    const [vFilterType, setVFilterType] = useState('ALL');
    const [vModalOpen, setVModalOpen] = useState(false);
    const [vEditMode, setVEditMode] = useState(false);
    const [vForm, setVForm] = useState<VoucherForm>(BLANK_FORM);
    const [vSaving, setVSaving] = useState(false);
    const [vDeleteId, setVDeleteId] = useState<string | null>(null);
    const [vToast, setVToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ── PAYMENT STATE ──
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAdmin[]>([]);
    const [methodsLoading, setMethodsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [formConfig, setFormConfig] = useState<Record<string, string>>({});

    // ── TOAST ──
    const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setVToast({ msg, type });
        setTimeout(() => setVToast(null), 3200);
    }, []);

    // ────────────────────────────────────────────────────────
    // VOUCHER API
    // ────────────────────────────────────────────────────────
    const fetchVouchers = useCallback(async () => {
        setVLoading(true);
        try {
            const res = await api.get('/voucher');
            setVouchers(res?.data || []);
        } catch { toast('Không thể tải danh sách voucher', 'error'); }
        finally { setVLoading(false); }
    }, [toast]);

    useEffect(() => { if (activeTab === 'voucher') fetchVouchers(); }, [activeTab, fetchVouchers]);

    const handleOpenCreate = () => {
        setVForm({ ...BLANK_FORM, id: generateId() });
        setVEditMode(false);
        setVModalOpen(true);
    };

    const handleOpenEdit = (v: Voucher) => {
        setVForm({
            id: v.id, code: v.code, title: v.title, type: v.type,
            value: String(v.value), maxDiscount: String(v.maxDiscount ?? ''),
            minOrder: String(v.minOrder), quantity: String(v.quantity),
            target: v.target, userId: String(v.userId ?? ''),
            status: v.status,
            startDate: v.startDate?.slice(0, 10) ?? '',
            expiredAt: v.expiredAt?.slice(0, 10) ?? '',
        });
        setVEditMode(true);
        setVModalOpen(true);
    };

    const handleVFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVForm(prev => ({ ...prev, [name]: value }));
    };

    const handleVSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVSaving(true);
        const body = {
            id: vForm.id, code: vForm.code.trim().toUpperCase(), title: vForm.title,
            type: vForm.type, value: Number(vForm.value),
            maxDiscount: vForm.maxDiscount ? Number(vForm.maxDiscount) : undefined,
            minOrder: Number(vForm.minOrder || 0), quantity: Number(vForm.quantity || 0),
            target: vForm.target, userId: vForm.userId ? Number(vForm.userId) : null,
            status: vForm.status, startDate: vForm.startDate, expiredAt: vForm.expiredAt,
        };
        try {
            if (vEditMode) {
                await api.patch(`/voucher/${vForm.id}`, body);
                toast('Cập nhật voucher thành công');
            } else {
                await api.post('/voucher', body);
                toast('Tạo voucher thành công');
            }
            setVModalOpen(false);
            fetchVouchers();
        } catch { toast('Lưu thất bại, kiểm tra lại dữ liệu', 'error'); }
        finally { setVSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/voucher/${id}`);
            toast('Đã xóa voucher');
            setVDeleteId(null);
            fetchVouchers();
        } catch { toast('Xóa thất bại', 'error'); }
    };

    // ────────────────────────────────────────────────────────
    // PAYMENT API
    // ────────────────────────────────────────────────────────
    const fetchPaymentMethods = useCallback(async () => {
        setMethodsLoading(true);
        try {
            const res = await api.get('/payment/admin/methods');
            setPaymentMethods(res?.data || []);
        } catch { console.error('Lỗi tải cổng thanh toán'); }
        finally { setMethodsLoading(false); }
    }, []);

    useEffect(() => { if (activeTab === 'payment') fetchPaymentMethods(); }, [activeTab, fetchPaymentMethods]);

    const handleOpenPayEdit = async (code: string) => {
        try {
            const res = await api.get(`/payment/admin/methods/${code}`);
            const data = res?.data;
            setSelectedMethod(data);
            setFormName(data.name);
            setFormActive(data.is_active);
            setFormConfig(data.config_fields || {});
            setIsPayModalOpen(true);
        } catch { toast('Không thể tải cấu hình cổng', 'error'); }
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod) return;
        try {
            await api.put(`/payment/admin/methods/${selectedMethod.code}`, {
                name: formName, isActive: formActive, configData: formConfig,
            });
            toast('Lưu cấu hình thành công');
            setIsPayModalOpen(false);
            fetchPaymentMethods();
        } catch { toast('Lỗi lưu cấu hình cổng', 'error'); }
    };

    // ────────────────────────────────────────────────────────
    // FILTERED VOUCHERS
    // ────────────────────────────────────────────────────────
    const filteredVouchers = vouchers.filter(v => {
        const matchSearch = vSearch === '' ||
            v.code.toLowerCase().includes(vSearch.toLowerCase()) ||
            v.title.toLowerCase().includes(vSearch.toLowerCase());
        const matchStatus = vFilterStatus === 'ALL' || v.status === vFilterStatus;
        const matchType = vFilterType === 'ALL' || v.type === vFilterType;
        return matchSearch && matchStatus && matchType;
    });

    // Stats
    const stats = {
        total: vouchers.length,
        active: vouchers.filter(v => v.status === 'ACTIVE').length,
        expired: vouchers.filter(v => v.status === 'EXPIRED').length,
        totalUsed: vouchers.reduce((s, v) => s + (v.used || 0), 0),
    };

    // ────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────
    return (
        <div className="analytics-container">
            {/* Toast */}
            {vToast && (
                <div className={`v-toast ${vToast.type}`}>
                    {vToast.type === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationCircleIcon className="w-4 h-4" />}
                    {vToast.msg}
                </div>
            )}

            {/* Header */}
            <div className="analytics-header">
                <h1 className="analytics-title">🎟️ Trung Tâm Quản Trị Ưu Đãi & Thanh Toán</h1>
                <p className="analytics-subtitle">Quản lý toàn bộ voucher giảm giá hệ thống và cấu hình các cổng thanh toán</p>
            </div>

            {/* Tabs */}
            <div className="analytics-tabs">
                <button className={`tab-link ${activeTab === 'voucher' ? 'active' : ''}`} onClick={() => setActiveTab('voucher')}>
                    <TicketIcon className="tab-icon" /> Trung tâm Voucher
                </button>
                <button className={`tab-link ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                    <CreditCardIcon className="tab-icon" /> Quản lý cổng thanh toán
                </button>
            </div>

            {/* ══════════════ TAB VOUCHER ══════════════ */}
            {activeTab === 'voucher' && (
                <div className="tab-content-fade">
                    {/* Stats row */}
                    <div className="v-stats-row">
                        <div className="v-stat-card"><GiftIcon className="v-stat-icon blue" /><div><span className="v-stat-num">{stats.total}</span><span className="v-stat-lbl">Tổng voucher</span></div></div>
                        <div className="v-stat-card"><CheckCircleIcon className="v-stat-icon green" /><div><span className="v-stat-num">{stats.active}</span><span className="v-stat-lbl">Đang hoạt động</span></div></div>
                        <div className="v-stat-card"><ClockIcon className="v-stat-icon gray" /><div><span className="v-stat-num">{stats.expired}</span><span className="v-stat-lbl">Đã hết hạn</span></div></div>
                        <div className="v-stat-card"><TagIcon className="v-stat-icon red" /><div><span className="v-stat-num">{stats.totalUsed}</span><span className="v-stat-lbl">Lượt đã dùng</span></div></div>
                    </div>

                    {/* Toolbar */}
                    <div className="v-toolbar">
                        <div className="v-search-wrap">
                            <MagnifyingGlassIcon className="v-search-icon" />
                            <input className="v-search-input" placeholder="Tìm mã hoặc tên voucher..." value={vSearch} onChange={e => setVSearch(e.target.value)} />
                        </div>
                        <div className="v-filters">
                            <select className="v-select" value={vFilterStatus} onChange={e => setVFilterStatus(e.target.value)}>
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="INACTIVE">Tạm dừng</option>
                                <option value="EXPIRED">Hết hạn</option>
                            </select>
                            <select className="v-select" value={vFilterType} onChange={e => setVFilterType(e.target.value)}>
                                <option value="ALL">Tất cả loại</option>
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED">Số tiền cố định</option>
                            </select>
                        </div>
                        <button className="v-btn-create" onClick={handleOpenCreate}>
                            <PlusIcon className="w-4 h-4" /> Tạo voucher
                        </button>
                    </div>

                    {/* Table */}
                    {vLoading ? (
                        <div className="admin-loading">Đang tải dữ liệu voucher...</div>
                    ) : filteredVouchers.length === 0 ? (
                        <div className="v-empty"><GiftIcon className="w-10 h-10" /><p>Không có voucher nào</p></div>
                    ) : (
                        <div className="v-table-wrap">
                            <table className="v-table">
                                <thead>
                                    <tr>
                                        <th>Mã voucher</th>
                                        <th>Tên / Mô tả</th>
                                        <th>Loại giảm</th>
                                        <th>Đơn tối thiểu</th>
                                        <th>Lượt dùng</th>
                                        <th>Đối tượng</th>
                                        <th>Hiệu lực</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVouchers.map(v => (
                                        <tr key={v.id}>
                                            <td><span className="v-code-chip">{v.code}</span></td>
                                            <td><span className="v-title">{v.title}</span></td>
                                            <td><TypeBadge type={v.type} value={v.value} /></td>
                                            <td className="v-mono">{Number(v.minOrder).toLocaleString('vi-VN')}₫</td>
                                            <td><UsageBar used={v.used} total={v.quantity} /></td>
                                            <td><TargetBadge target={v.target} /></td>
                                            <td className="v-date-cell">
                                                <span>{formatDate(v.startDate)}</span>
                                                <span className="v-date-sep">→</span>
                                                <span>{formatDate(v.expiredAt)}</span>
                                            </td>
                                            <td><StatusBadge status={v.status} /></td>
                                            <td>
                                                <div className="v-actions">
                                                    <button className="v-act-btn edit" onClick={() => handleOpenEdit(v)} title="Sửa"><PencilIcon className="w-4 h-4" /></button>
                                                    <button className="v-act-btn del" onClick={() => setVDeleteId(v.id)} title="Xóa"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ TAB PAYMENT ══════════════ */}
            {activeTab === 'payment' && (
                <div className="tab-content-fade">
                    <div className="pay-section-header">
                        <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                        <div>
                            <h2 className="pay-section-title">Cổng thanh toán tích hợp</h2>
                            <p className="pay-section-sub">Bật/tắt và cấu hình từng cổng thanh toán — thay đổi có hiệu lực ngay không cần restart server</p>
                        </div>
                    </div>

                    {methodsLoading ? (
                        <div className="admin-loading">Đang tải cổng thanh toán...</div>
                    ) : paymentMethods.length === 0 ? (
                        <div className="v-empty"><CreditCardIcon className="w-10 h-10" /><p>Không có cổng nào được cấu hình</p></div>
                    ) : (
                        <div className="pay-grid">
                            {paymentMethods.map((method) => (
                                <div key={method.code} className={`pay-card ${method.is_active ? 'online' : 'offline'}`}>
                                    <div className="pay-card-top">
                                        <div className="pay-logo-wrap">
                                            <img src={method.logoUrl || 'https://placehold.co/48x48/f3f4f6/9ca3af?text=' + method.code} alt={method.name} className="pay-logo" />
                                        </div>
                                        <div className={`pay-status-pill ${method.is_active ? 'on' : 'off'}`}>
                                            <span className="pay-status-dot" />
                                            {method.is_active ? 'Hoạt động' : 'Tắt'}
                                        </div>
                                    </div>
                                    <div className="pay-card-body">
                                        <h4 className="pay-name">{method.name}</h4>
                                        <code className="pay-code">{method.code}</code>
                                        <p className="pay-desc">{method.description || 'Cổng thanh toán trực tuyến được mã hóa bảo mật.'}</p>
                                    </div>
                                    {method.updated_at && (
                                        <div className="pay-updated">
                                            <ClockIcon className="w-3 h-3" />
                                            Cập nhật: {formatDate(method.updated_at)}
                                        </div>
                                    )}
                                    <div className="pay-card-footer">
                                        <button className="pay-cfg-btn" onClick={() => handleOpenPayEdit(method.code)}>
                                            <AdjustmentsHorizontalIcon className="w-4 h-4" /> Cấu hình bảo mật
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ MODAL TẠO / SỬA VOUCHER ══════════════ */}
            {vModalOpen && (
                <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setVModalOpen(false); }}>
                    <div className="admin-modal-box">
                        <div className="modal-header">
                            <h3>{vEditMode ? '✏️ Chỉnh sửa voucher' : '🎟️ Tạo voucher mới'}</h3>
                            <button className="close-x-btn" onClick={() => setVModalOpen(false)}><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleVSubmit}>
                            <div className="modal-body-scroll">
                                <div className="modal-2col">
                                    <div className="form-group-row">
                                        <label>Mã voucher <span className="req">*</span></label>
                                        <input name="code" value={vForm.code} onChange={handleVFormChange}
                                            placeholder="VD: SUMMER2025" required style={{ textTransform: 'uppercase' }} />
                                    </div>
                                    <div className="form-group-row">
                                        <label>Tiêu đề <span className="req">*</span></label>
                                        <input name="title" value={vForm.title} onChange={handleVFormChange} placeholder="Giảm giá mùa hè" required />
                                    </div>
                                </div>
                                <div className="modal-2col">
                                    <div className="form-group-row">
                                        <label>Loại giảm giá <span className="req">*</span></label>
                                        <select name="type" value={vForm.type} onChange={handleVFormChange}>
                                            <option value="PERCENT">Phần trăm (%)</option>
                                            <option value="FIXED">Số tiền cố định (₫)</option>
                                        </select>
                                    </div>
                                    <div className="form-group-row">
                                        <label>Giá trị giảm <span className="req">*</span></label>
                                        <input name="value" type="number" min="0" value={vForm.value} onChange={handleVFormChange}
                                            placeholder={vForm.type === 'PERCENT' ? 'VD: 20 (%)' : 'VD: 50000 (₫)'} required />
                                    </div>
                                </div>
                                <div className="modal-2col">
                                    <div className="form-group-row">
                                        <label>Giảm tối đa (₫)</label>
                                        <input name="maxDiscount" type="number" min="0" value={vForm.maxDiscount} onChange={handleVFormChange} placeholder="Bỏ trống = không giới hạn" />
                                    </div>
                                    <div className="form-group-row">
                                        <label>Đơn hàng tối thiểu (₫)</label>
                                        <input name="minOrder" type="number" min="0" value={vForm.minOrder} onChange={handleVFormChange} placeholder="0 = không yêu cầu" />
                                    </div>
                                </div>
                                <div className="modal-2col">
                                    <div className="form-group-row">
                                        <label>Số lượng phát hành</label>
                                        <input name="quantity" type="number" min="0" value={vForm.quantity} onChange={handleVFormChange} placeholder="0 = không giới hạn" />
                                    </div>
                                    <div className="form-group-row">
                                        <label>Đối tượng áp dụng</label>
                                        <select name="target" value={vForm.target} onChange={handleVFormChange}>
                                            <option value="ALL">Tất cả người dùng</option>
                                            <option value="SPECIFIC_USER">Cá nhân (userId)</option>
                                            <option value="LUCKY_WHEEL">Vòng quay may mắn</option>
                                        </select>
                                    </div>
                                </div>
                                {vForm.target === 'SPECIFIC_USER' && (
                                    <div className="form-group-row">
                                        <label>User ID <span className="req">*</span></label>
                                        <input name="userId" type="number" value={vForm.userId} onChange={handleVFormChange} placeholder="ID người dùng" required />
                                    </div>
                                )}
                                <div className="modal-2col">
                                    <div className="form-group-row">
                                        <label>Ngày bắt đầu</label>
                                        <input name="startDate" type="date" value={vForm.startDate} onChange={handleVFormChange} />
                                    </div>
                                    <div className="form-group-row">
                                        <label>Ngày hết hạn</label>
                                        <input name="expiredAt" type="date" value={vForm.expiredAt} onChange={handleVFormChange} />
                                    </div>
                                </div>
                                <div className="form-group-row">
                                    <label>Trạng thái</label>
                                    <select name="status" value={vForm.status} onChange={handleVFormChange}>
                                        <option value="ACTIVE">Đang hoạt động</option>
                                        <option value="INACTIVE">Tạm dừng</option>
                                        <option value="EXPIRED">Hết hạn</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer-actions">
                                <button type="button" className="btn-cancel-modal" onClick={() => setVModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save-modal" disabled={vSaving}>
                                    {vSaving ? 'Đang lưu...' : vEditMode ? 'Cập nhật' : 'Tạo voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════ CONFIRM DELETE ══════════════ */}
            {vDeleteId && (
                <div className="admin-modal-overlay">
                    <div className="confirm-dialog">
                        <TrashIcon className="w-10 h-10 text-red-500" />
                        <h3>Xác nhận xóa voucher?</h3>
                        <p>Hành động này không thể hoàn tác. Voucher sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
                        <div className="confirm-actions">
                            <button className="btn-cancel-modal" onClick={() => setVDeleteId(null)}>Hủy</button>
                            <button className="btn-delete-confirm" onClick={() => handleDelete(vDeleteId)}>Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL CẤU HÌNH PAYMENT ══════════════ */}
            {isPayModalOpen && selectedMethod && (
                <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsPayModalOpen(false); }}>
                    <div className="admin-modal-box">
                        <div className="modal-header">
                            <h3>⚙️ Cấu hình: {selectedMethod.name}</h3>
                            <button className="close-x-btn" onClick={() => setIsPayModalOpen(false)}><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSavePayment}>
                            <div className="modal-body-scroll">
                                <div className="form-group-row">
                                    <label>Tên hiển thị</label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required />
                                </div>
                                <div className="form-group-row">
                                    <label className="toggle-label">
                                        <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} />
                                        Bật cổng này tại trang Checkout
                                    </label>
                                </div>
                                {Object.keys(formConfig).length > 0 && (
                                    <>
                                        <div className="config-section-divider">
                                            <span>🔑 Thông số API & Bảo mật</span>
                                        </div>
                                        <p className="config-subtitle">Cập nhật trực tiếp — không cần restart server.</p>
                                        {Object.keys(formConfig).map(k => (
                                            <div key={k} className="form-group-row">
                                                <label><code>{k}</code></label>
                                                <input type="text" value={formConfig[k]} onChange={e => setFormConfig(prev => ({ ...prev, [k]: e.target.value }))} />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer-actions">
                                <button type="button" className="btn-cancel-modal" onClick={() => setIsPayModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save-modal">Lưu cấu hình</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
