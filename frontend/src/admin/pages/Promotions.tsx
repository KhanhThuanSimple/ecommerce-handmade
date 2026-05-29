import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    PlayIcon,
    StopIcon,
    TagIcon,
    GiftIcon,
    FireIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';

interface Promotion {
    id: number;
    name: string;
    description: string;
    type: 'coupon' | 'flash_sale' | 'bundle';
    code?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    status: 'active' | 'inactive' | 'expired';
    products?: number[];
    categories?: number[];
}

const Promotions: React.FC = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [formData, setFormData] = useState<Partial<Promotion>>({
        type: 'coupon',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 0,
        usageLimit: 100,
        status: 'active',
    });
    
    const notify = useNotify();

    useEffect(() => {
        // Mock data - replace with API call
        const mockPromotions: Promotion[] = [
            {
                id: 1,
                name: 'Giảm giá Tết Bính Ngọ',
                description: 'Giảm 20% cho tất cả sản phẩm handmade',
                type: 'coupon',
                code: 'TET2026',
                discountType: 'percentage',
                discountValue: 20,
                minOrderValue: 500000,
                maxDiscount: 200000,
                startDate: '2026-01-20',
                endDate: '2026-02-10',
                usageLimit: 500,
                usedCount: 234,
                status: 'active',
            },
            {
                id: 2,
                name: 'Flash Sale Tối Thứ 6',
                description: 'Siêu giảm giá 50% các sản phẩm chọn lọc',
                type: 'flash_sale',
                discountType: 'percentage',
                discountValue: 50,
                minOrderValue: 0,
                startDate: '2026-01-17',
                endDate: '2026-01-17',
                usageLimit: 100,
                usedCount: 89,
                status: 'active',
                products: [1, 2, 3],
            },
            {
                id: 3,
                name: 'Mua 2 tặng 1',
                description: 'Mua 2 sản phẩm bất kỳ tặng 1 sản phẩm cùng loại',
                type: 'bundle',
                discountType: 'percentage',
                discountValue: 33,
                minOrderValue: 0,
                startDate: '2026-01-10',
                endDate: '2026-01-25',
                usageLimit: 200,
                usedCount: 200,
                status: 'expired',
            },
            {
                id: 4,
                name: 'Miễn phí vận chuyển',
                description: 'Miễn phí vận chuyển cho đơn hàng từ 300.000đ',
                type: 'coupon',
                code: 'FREESHIP',
                discountType: 'fixed',
                discountValue: 50000,
                minOrderValue: 300000,
                startDate: '2026-01-01',
                endDate: '2026-02-28',
                usageLimit: 1000,
                usedCount: 567,
                status: 'active',
            },
        ];
        setPromotions(mockPromotions);
        setLoading(false);
    }, []);

    const getTypeIcon = (type: Promotion['type']) => {
        const icons = {
            coupon: <TagIcon className="w-5 h-5" />,
            flash_sale: <FireIcon className="w-5 h-5" />,
            bundle: <CubeIcon className="w-5 h-5" />,
        };
        return icons[type];
    };

    const getTypeBadgeClass = (type: Promotion['type']) => {
        const classes = {
            coupon: 'promotion-type-badge coupon',
            flash_sale: 'promotion-type-badge flash-sale',
            bundle: 'promotion-type-badge bundle',
        };
        return classes[type];
    };

    const getTypeText = (type: Promotion['type']) => {
        const texts = {
            coupon: 'Mã giảm giá',
            flash_sale: 'Flash Sale',
            bundle: 'Combo',
        };
        return texts[type];
    };

    const getStatusText = (status: Promotion['status']) => {
        const texts = {
            active: 'Đang hoạt động',
            inactive: 'Tạm dừng',
            expired: 'Hết hạn',
        };
        return texts[status];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDiscount = (promotion: Promotion) => {
        if (promotion.discountType === 'percentage') {
            return `${promotion.discountValue}%`;
        }
        return formatCurrency(promotion.discountValue);
    };

    const getDiscountText = (promotion: Promotion) => {
        if (promotion.type === 'coupon') {
            return `Giảm ${formatDiscount(promotion)} ${promotion.minOrderValue > 0 ? `cho đơn từ ${formatCurrency(promotion.minOrderValue)}` : ''}`;
        }
        if (promotion.type === 'flash_sale') {
            return `Giảm ${formatDiscount(promotion)}`;
        }
        return `Mua 2 tặng 1`;
    };

    const handleSave = async () => {
        try {
            if (editingPromotion) {
                // Update API call
                notify.success('Cập nhật chương trình thành công');
            } else {
                // Create API call
                notify.success('Thêm chương trình thành công');
            }
            setShowModal(false);
            setEditingPromotion(null);
            setFormData({});
        } catch (error) {
            notify.error('Lưu thất bại');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chương trình này?')) {
            try {
                // Delete API call
                setPromotions(promotions.filter(p => p.id !== id));
                notify.success('Xóa chương trình thành công');
            } catch (error) {
                notify.error('Xóa thất bại');
            }
        }
    };

    const handleToggleStatus = async (promotion: Promotion) => {
        const newStatus = promotion.status === 'active' ? 'inactive' : 'active';
        try {
            // API call to update status
            setPromotions(promotions.map(p => 
                p.id === promotion.id ? { ...p, status: newStatus } : p
            ));
            notify.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm dừng'} chương trình`);
        } catch (error) {
            notify.error('Thao tác thất bại');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang tải danh sách khuyến mãi...</p>
            </div>
        );
    }

    return (
        <div className="promotions-container">
            {/* Header */}
            <div className="promotions-header">
                <div className="promotions-title">
                    <h1>
                        🎁 Quản Lý Khuyến Mãi
                    </h1>
                    <p className="promotions-subtitle">
                        Tạo và quản lý các chương trình giảm giá, mã voucher, flash sale
                    </p>
                </div>
                <button 
                    className="create-btn"
                    onClick={() => {
                        setEditingPromotion(null);
                        setFormData({});
                        setShowModal(true);
                    }}
                >
                    <PlusIcon className="w-5 h-5" />
                    Tạo chương trình mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="promotion-stats">
                <div className="promo-stat-card">
                    <div className="promo-stat-value">{promotions.length}</div>
                    <div className="promo-stat-label">Tổng chương trình</div>
                </div>
                <div className="promo-stat-card">
                    <div className="promo-stat-value">{promotions.filter(p => p.status === 'active').length}</div>
                    <div className="promo-stat-label">Đang hoạt động</div>
                </div>
                <div className="promo-stat-card">
                    <div className="promo-stat-value">{promotions.reduce((sum, p) => sum + p.usedCount, 0)}</div>
                    <div className="promo-stat-label">Lượt sử dụng</div>
                </div>
            </div>

            {/* Promotions Grid */}
            <div className="promotions-grid">
                {promotions.map((promotion) => (
                    <div key={promotion.id} className={`promotion-card ${promotion.status}`}>
                        <div className="promotion-card-header">
                            <div className={getTypeBadgeClass(promotion.type)}>
                                {getTypeText(promotion.type)}
                            </div>
                            <div className="promotion-icon">
                                {getTypeIcon(promotion.type)}
                            </div>
                            <h3 className="promotion-name">{promotion.name}</h3>
                            <p className="promotion-description">{promotion.description}</p>
                        </div>
                        
                        <div className="promotion-card-body">
                            {promotion.code && (
                                <div className="promotion-code">
                                    Mã: {promotion.code}
                                </div>
                            )}
                            
                            <div className="promotion-detail">
                                <span className="promotion-detail-label">Giá trị:</span>
                                <span className="promotion-detail-value">{getDiscountText(promotion)}</span>
                            </div>
                            
                            <div className="promotion-detail">
                                <span className="promotion-detail-label">Thời gian:</span>
                                <span className="promotion-detail-value">
                                    {promotion.startDate} → {promotion.endDate}
                                </span>
                            </div>
                            
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${(promotion.usedCount / promotion.usageLimit) * 100}%` }}
                                ></div>
                            </div>
                            <div className="usage-stats">
                                <span>Đã dùng: {promotion.usedCount}</span>
                                <span>Giới hạn: {promotion.usageLimit}</span>
                            </div>
                        </div>
                        
                        <div className="promotion-card-footer">
                            <button 
                                className="card-btn edit"
                                onClick={() => {
                                    setEditingPromotion(promotion);
                                    setFormData(promotion);
                                    setShowModal(true);
                                }}
                            >
                                <PencilIcon className="w-4 h-4" />
                                Sửa
                            </button>
                            
                            {promotion.status === 'active' ? (
                                <button 
                                    className="card-btn deactivate"
                                    onClick={() => handleToggleStatus(promotion)}
                                >
                                    <StopIcon className="w-4 h-4" />
                                    Tạm dừng
                                </button>
                            ) : promotion.status === 'inactive' && (
                                <button 
                                    className="card-btn activate"
                                    onClick={() => handleToggleStatus(promotion)}
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Kích hoạt
                                </button>
                            )}
                            
                            <button 
                                className="card-btn delete"
                                onClick={() => handleDelete(promotion.id)}
                            >
                                <TrashIcon className="w-4 h-4" />
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="promo-modal-header">
                            <h3 className="promo-modal-title">
                                {editingPromotion ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}
                            </h3>
                            <button className="promo-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="promo-modal-body">
                            <div className="form-group">
                                <label>Tên chương trình</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Giảm giá Tết Nguyên Đán"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Mô tả chi tiết về chương trình..."
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Loại khuyến mãi</label>
                                    <select 
                                        value={formData.type || 'coupon'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                                    >
                                        <option value="coupon">Mã giảm giá</option>
                                        <option value="flash_sale">Flash Sale</option>
                                        <option value="bundle">Mua kèm/Combo</option>
                                    </select>
                                </div>
                                
                                {formData.type === 'coupon' && (
                                    <div className="form-group">
                                        <label>Mã giảm giá</label>
                                        <input 
                                            type="text" 
                                            placeholder="VD: SALE20"
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hình thức giảm</label>
                                    <select 
                                        value={formData.discountType || 'percentage'}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                                    >
                                        <option value="percentage">Phần trăm (%)</option>
                                        <option value="fixed">Số tiền cố định</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Giá trị giảm</label>
                                    <input 
                                        type="number" 
                                        placeholder={formData.discountType === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                                        value={formData.discountValue || ''}
                                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Đơn hàng tối thiểu</label>
                                <input 
                                    type="number" 
                                    placeholder="0 - Không yêu cầu"
                                    value={formData.minOrderValue || 0}
                                    onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ngày bắt đầu</label>
                                    <input 
                                        type="date" 
                                        value={formData.startDate || ''}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Ngày kết thúc</label>
                                    <input 
                                        type="date" 
                                        value={formData.endDate || ''}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giới hạn lượt sử dụng</label>
                                    <input 
                                        type="number" 
                                        placeholder="VD: 100"
                                        value={formData.usageLimit || 100}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select 
                                        value={formData.status || 'active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Promotion['status'] })}
                                    >
                                        <option value="active">Kích hoạt</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className="btn-submit" onClick={handleSave}>
                                {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;