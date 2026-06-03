import React, { useState, useEffect } from 'react';
import {
    GiftIcon,
    TrophyIcon,
    UsersIcon,
    CalendarIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ChartBarIcon,
    ArrowPathIcon,
    StarIcon,
    TicketIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';
import gameService, { Prize, UserSpinProfile, GameStatistics } from '../../services/gameService';
import '../styles/games.css';

const Games: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'prizes' | 'users' | 'stats'>('prizes');
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [showPointsModal, setShowPointsModal] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserSpinProfile | null>(null);
    const [pointsToAdd, setPointsToAdd] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // State data
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [spinProfiles, setSpinProfiles] = useState<UserSpinProfile[]>([]);
    const [statistics, setStatistics] = useState<GameStatistics>({
        totalUsers: 0,
        totalPoints: 0,
        usersSpunToday: 0,
        averagePoints: 0,
    });
    
    // Form state
    const [prizeForm, setPrizeForm] = useState<Partial<Prize>>({
        name: '',
        type: 'points',
        value: 0,
        icon: '🎁',
        color: '#c41e3a',
        textColor: '#ffffff',
        description: '',
        active: true,
        probability: 0.1,
    });
    
    const notify = useNotify();

    // Check admin access
    useEffect(() => {
        const checkAdminAccess = async () => {
            const user = gameService.getCurrentUser();
            const admin = gameService.isAdmin();
            
            setCurrentUser(user);
            setIsAdmin(admin);
            
            if (!admin) {
                notify.error('Bạn không có quyền truy cập trang này');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        };
        
        checkAdminAccess();
    }, [notify]);

    // Fetch data
    const fetchData = async () => {
        if (!isAdmin) return;
        
        setLoading(true);
        try {
            // Fetch prizes
            const prizesData = await gameService.getPrizes();
            setPrizes(prizesData);
            
            // Fetch statistics
            const statsData = await gameService.getStatistics();
            setStatistics(statsData);
            
            // Fetch user spin profiles - SỬA LẠI CÁCH GỌI
            try {
                const profilesData = await gameService.getUserSpinProfiles();
                setSpinProfiles(profilesData);
            } catch (profileError) {
                console.error('Error fetching profiles:', profileError);
                // Nếu chưa có endpoint /profiles, tạo dữ liệu mẫu từ users
                setSpinProfiles([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            notify.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    // Prize handlers
    const handleAddPrize = () => {
        setEditingPrize(null);
        setPrizeForm({
            name: '',
            type: 'points',
            value: 0,
            icon: '🎁',
            color: '#c41e3a',
            textColor: '#ffffff',
            description: '',
            active: true,
            probability: 0.1,
        });
        setShowPrizeModal(true);
    };

    const handleEditPrize = (prize: Prize) => {
        setEditingPrize(prize);
        setPrizeForm(prize);
        setShowPrizeModal(true);
    };

    const handleSavePrize = async () => {
        if (!prizeForm.name || prizeForm.value === undefined) {
            notify.warning('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            if (editingPrize) {
                await gameService.updatePrize(editingPrize.id, prizeForm);
                notify.success('Cập nhật giải thưởng thành công');
            } else {
                await gameService.createPrize(prizeForm as Omit<Prize, 'id'>);
                notify.success('Thêm giải thưởng thành công');
            }
            await fetchData();
            setShowPrizeModal(false);
        } catch (error: any) {
            console.error('Save error:', error);
            notify.error(error.response?.data?.message || 'Lưu thất bại');
        }
    };

   const handleDeletePrize = async (id: number) => {
    // Thêm confirm để tránh xóa nhầm
    if (!window.confirm('Bạn có chắc chắn muốn xóa giải thưởng này? Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        // Log để debug
        console.log('Deleting prize with ID:', id);
        
        const response = await gameService.deletePrize(id);
        console.log('Delete response:', response);
        
        notify.success('Xóa giải thưởng thành công');
        await fetchData(); // Refresh danh sách
    } catch (error: any) {
        console.error('Delete error details:', error);
        
        // Xử lý các lỗi cụ thể
        if (error.response?.status === 409) {
            notify.error('Không thể xóa vì giải thưởng đã được sử dụng trong lịch sử quay');
        } else if (error.response?.status === 404) {
            notify.error('Không tìm thấy giải thưởng');
        } else {
            notify.error(error.response?.data?.message || 'Xóa thất bại');
        }
    }
};
    // User points handlers
    const handleAddPoints = async () => {
        if (!selectedUser || pointsToAdd <= 0) {
            notify.warning('Vui lòng nhập số điểm hợp lệ');
            return;
        }

        try {
            await gameService.addPoints(selectedUser.userId, pointsToAdd);
            notify.success(`Đã thêm ${pointsToAdd} điểm cho ${selectedUser.user?.fullName || selectedUser.user?.email}`);
            await fetchData();
            setShowPointsModal(false);
            setPointsToAdd(0);
            setSelectedUser(null);
        } catch (error: any) {
            console.error('Add points error:', error);
            notify.error(error.response?.data?.message || 'Thêm điểm thất bại');
        }
    };

    const handleResetSpinLimit = async (userId: number, userName: string) => {
        if (window.confirm(`Xác nhận reset giới hạn quay cho ${userName}?`)) {
            try {
                await gameService.resetSpinLimit(userId);
                notify.success('Reset giới hạn quay thành công');
                await fetchData();
            } catch (error: any) {
                console.error('Reset error:', error);
                notify.error(error.response?.data?.message || 'Reset thất bại');
            }
        }
    };

    // Helper functions
    const formatCurrency = (amount?: number) => {
        if (!amount) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getTypeText = (type: string) => {
        const texts: Record<string, string> = {
            points: 'Điểm thưởng',
            discount: 'Giảm giá (%)',
            voucher: 'Voucher',
            empty: 'Cảm ơn',
        };
        return texts[type] || type;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Chưa quay lần nào';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    // Check if user has admin access
    if (!isAdmin && !loading) {
        return (
            <div className="access-denied">
                <div className="access-denied-content">
                    <ShieldCheckIcon className="access-denied-icon" />
                    <h2>Access Denied</h2>
                    <p>Bạn không có quyền truy cập trang quản trị</p>
                    <button onClick={() => window.location.href = '/'}>
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="admin-luckywheel">
            {/* Admin Badge */}
            {currentUser && (
                <div className="admin-badge">
                    <ShieldCheckIcon className="admin-badge-icon" />
                    <span>Quản trị viên: {currentUser.email}</span>
                </div>
            )}

            {/* Header */}
            <div className="admin-luckywheel-header">
                <div className="header-content">
                    <h1>
                        <TrophyIcon className="header-icon" />
                        Quản Lý Vòng Quay May Mắn
                    </h1>
                    <p className="header-subtitle">Quản lý giải thưởng, điểm thưởng và người chơi</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchData}>
                        <ArrowPathIcon className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{statistics.totalUsers}</div>
                        <div className="stat-label">Người dùng</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-gold">
                        <StarIcon className="w-6 h-6" />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{statistics.totalPoints.toLocaleString()}</div>
                        <div className="stat-label">Tổng điểm</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{statistics.usersSpunToday}</div>
                        <div className="stat-label">Quay hôm nay</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{statistics.averagePoints.toLocaleString()}</div>
                        <div className="stat-label">Điểm TB</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'prizes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prizes')}
                >
                    <GiftIcon className="tab-icon" />
                    Giải thưởng
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <UsersIcon className="tab-icon" />
                    Người chơi
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    <ChartBarIcon className="tab-icon" />
                    Thống kê
                </button>
            </div>

            {/* Prizes Tab */}
            {activeTab === 'prizes' && (
                <div className="prizes-tab">
                    <div className="tab-header">
                        <h2>Danh sách giải thưởng</h2>
                        <button className="btn-create" onClick={handleAddPrize}>
                            <PlusIcon className="w-4 h-4" />
                            Thêm giải thưởng
                        </button>
                    </div>

                    <div className="prizes-grid">
                        {prizes.map((prize) => (
                            <div key={prize.id} className="prize-card" style={{ borderTopColor: prize.color }}>
                                <div className="prize-card-header">
                                    <div className="prize-icon" style={{ backgroundColor: prize.color }}>
                                        <span className="prize-emoji">{prize.icon || '🎁'}</span>
                                    </div>
                                    <div className="prize-info">
                                        <h3>{prize.name}</h3>
                                        <span className="prize-type">{getTypeText(prize.type || 'points')}</span>
                                    </div>
                                    <div className="prize-actions">
                                        <button className="action-btn edit" onClick={() => handleEditPrize(prize)}>
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDeletePrize(prize.id)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="prize-card-body">
                                    <p className="prize-description">{prize.description || 'Chưa có mô tả'}</p>
                                    <div className="prize-value">
                                        <strong>Giá trị:</strong>
                                        <span>
                                            {prize.type === 'points' && `${prize.value} điểm`}
                                            {prize.type === 'discount' && `Giảm ${prize.value}%`}
                                            {prize.type === 'voucher' && formatCurrency(prize.value)}
                                            {prize.type === 'empty' && 'Chúc may mắn lần sau'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="users-tab">
                    <div className="tab-header">
                        <h2>Danh sách người chơi</h2>
                        <p className="tab-subtitle">Quản lý điểm thưởng và lượt quay của người dùng</p>
                    </div>

                    <div className="users-table-container">
                        {spinProfiles.length === 0 ? (
                            <div className="empty-state">
                                <ExclamationTriangleIcon className="empty-icon" />
                                <p>Chưa có dữ liệu người chơi</p>
                                <p className="empty-hint">Hãy đảm bảo đã thêm endpoint <code>/api/admin/lucky-wheel/profiles</code> vào backend</p>
                            </div>
                        ) : (
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Điểm thưởng</th>
                                        <th>Lần quay cuối</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spinProfiles.map((profile) => (
                                        <tr key={profile.userId}>
                                            <td>
                                                <div className="user-info">
                                                    <div className="user-avatar">
                                                        {profile.user?.fullName?.charAt(0) || profile.user?.email?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="user-details">
                                                        <div className="user-name">{profile.user?.fullName || 'Unknown'}</div>
                                                        <div className="user-email">{profile.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="points-display">
                                                    <StarIcon className="points-icon" />
                                                    <span className="points-value">{profile.points?.toLocaleString() || 0}</span>
                                                </div>
                                            </td>
                                            <td>{formatDate(profile.lastSpinDate)}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="action-btn add-points"
                                                        onClick={() => {
                                                            setSelectedUser(profile);
                                                            setShowPointsModal(true);
                                                        }}
                                                        title="Cộng điểm"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                        Cộng điểm
                                                    </button>
                                                    <button 
                                                        className="action-btn reset"
                                                        onClick={() => handleResetSpinLimit(profile.userId, profile.user?.fullName || profile.user?.email || '')}
                                                        title="Reset giới hạn quay"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                        Reset
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
                <div className="stats-tab">
                    <div className="stats-card">
                        <h3>Thống kê chi tiết</h3>
                        <div className="stats-details">
                            <div className="stat-item">
                                <div className="stat-label">Tổng số người dùng tham gia</div>
                                <div className="stat-number">{statistics.totalUsers}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Tổng điểm thưởng đã phát</div>
                                <div className="stat-number">{statistics.totalPoints.toLocaleString()}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Người quay hôm nay</div>
                                <div className="stat-number">{statistics.usersSpunToday}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Điểm trung bình mỗi người</div>
                                <div className="stat-number">{statistics.averagePoints.toLocaleString()}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Số lượng giải thưởng</div>
                                <div className="stat-number">{prizes.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="info-card">
                        <h4>📌 Hướng dẫn quản lý</h4>
                        <ul>
                            <li><strong>Giải thưởng:</strong> Thêm/sửa/xóa các giải thưởng trong vòng quay</li>
                            <li><strong>Điểm thưởng:</strong> Có thể cộng thêm điểm cho người dùng bất kỳ lúc nào</li>
                            <li><strong>Reset giới hạn quay:</strong> Cho phép người dùng quay lại trong ngày</li>
                            <li><strong>Loại giải thưởng:</strong>
                                <ul>
                                    <li>Điểm thưởng - Cộng điểm vào tài khoản</li>
                                    <li>Giảm giá (%) - Áp dụng cho đơn hàng</li>
                                    <li>Voucher - Giảm giá theo số tiền</li>
                                    <li>Cảm ơn - Không có thưởng</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Prize Modal - giữ nguyên */}
            {showPrizeModal && (
                <div className="modal-overlay" onClick={() => setShowPrizeModal(false)}>
                    <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPrize ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng mới'}</h3>
                            <button className="modal-close" onClick={() => setShowPrizeModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Tên giải thưởng <span className="required">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="VD: 100 Points, Voucher 50k..."
                                    value={prizeForm.name}
                                    onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Loại giải thưởng</label>
                                    <select 
                                        value={prizeForm.type}
                                        onChange={(e) => setPrizeForm({ ...prizeForm, type: e.target.value as any })}
                                    >
                                        <option value="points">Điểm thưởng</option>
                                        <option value="discount">Giảm giá (%)</option>
                                        <option value="voucher">Voucher</option>
                                        <option value="empty">Cảm ơn</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Giá trị <span className="required">*</span></label>
                                    <input 
                                        type="number" 
                                        placeholder={prizeForm.type === 'discount' ? '% giảm' : 'Số tiền/điểm'}
                                        value={prizeForm.value}
                                        onChange={(e) => setPrizeForm({ ...prizeForm, value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Biểu tượng (Emoji)</label>
                                    <input 
                                        type="text" 
                                        placeholder="VD: 🎁, 🎟️, ⭐"
                                        value={prizeForm.icon}
                                        onChange={(e) => setPrizeForm({ ...prizeForm, icon: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Màu nền</label>
                                    <input 
                                        type="color" 
                                        value={prizeForm.color}
                                        onChange={(e) => setPrizeForm({ ...prizeForm, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Mô tả chi tiết về giải thưởng..."
                                    value={prizeForm.description}
                                    onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowPrizeModal(false)}>Hủy</button>
                            <button className="btn-submit" onClick={handleSavePrize}>
                                {editingPrize ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Points Modal - giữ nguyên */}
            {showPointsModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowPointsModal(false)}>
                    <div className="points-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cộng điểm cho người dùng</h3>
                            <button className="modal-close" onClick={() => setShowPointsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="user-summary">
                                <div className="user-avatar-large">
                                    {selectedUser.user?.fullName?.charAt(0) || selectedUser.user?.email?.charAt(0) || 'U'}
                                </div>
                                <div className="user-info-summary">
                                    <div className="user-name">{selectedUser.user?.fullName || 'Unknown'}</div>
                                    <div className="user-email">{selectedUser.user?.email}</div>
                                    <div className="current-points">
                                        Điểm hiện tại: <strong>{selectedUser.points?.toLocaleString() || 0}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Số điểm cần cộng</label>
                                <input 
                                    type="number" 
                                    className="points-input"
                                    placeholder="Nhập số điểm..."
                                    value={pointsToAdd}
                                    onChange={(e) => setPointsToAdd(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowPointsModal(false)}>Hủy</button>
                            <button className="btn-submit" onClick={handleAddPoints}>
                                <CheckCircleIcon className="w-4 h-4" />
                                Xác nhận cộng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Games;