import React, { useState, useEffect } from 'react';
import {
    GiftIcon,
    TrophyIcon,
    UsersIcon,
    CalendarIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    PlayIcon,
    StopIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';

// ===== INTERFACES =====
interface Winner {
    id: number;
    userId?: number;
    name: string;
    email?: string;
    phone?: string;
    prize: string;
    prizeId: number;
    date: string;
    spinCount: number;
    claimed: boolean;
    claimedDate?: string;
}

interface GameStats {
    totalSpins: number;
    totalWinners: number;
    totalGifts: number;
    activePlayers: number;
    todaySpins: number;
    conversionRate: number;
}

interface GamePrize {
    id: number;
    name: string;
    type: 'voucher' | 'product' | 'discount' | 'none';
    value?: number;
    color: string;
    textColor: string;
    icon: string;
    description: string;
    quantity: number;
    remaining: number;
    probability: number;
    claimed: number;
}

interface GameConfig {
    id: number;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    startDate: string;
    endDate: string;
    spinLimit: number;
    spinCost: number;
    freeSpinPerDay: number;
    requireLogin: boolean;
    allowMultipleSpin: boolean;
    theme: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        wheelImage?: string;
    };
}

const Games: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'prizes' | 'winners' | 'config' | 'analytics'>('prizes');
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [editingPrize, setEditingPrize] = useState<GamePrize | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
    
    const notify = useNotify();

    // State data
    const [gameStats, setGameStats] = useState<GameStats>({
        totalSpins: 1250,
        totalWinners: 342,
        totalGifts: 156,
        activePlayers: 89,
        todaySpins: 45,
        conversionRate: 27.36,
    });

    const [gameConfig, setGameConfig] = useState<GameConfig>({
        id: 1,
        name: 'Vòng quay may mắn Tết Bính Ngọ 2026',
        description: 'Quay số trúng thưởng nhận quà Tết cực chất',
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        spinLimit: 10,
        spinCost: 0,
        freeSpinPerDay: 3,
        requireLogin: true,
        allowMultipleSpin: true,
        theme: {
            primaryColor: '#c41e3a',
            secondaryColor: '#f59e0b',
            backgroundColor: '#fff5f5',
        },
    });

    const [prizes, setPrizes] = useState<GamePrize[]>([
        {
            id: 1,
            name: 'Voucher 100.000đ',
            type: 'voucher',
            value: 100000,
            color: '#F59E0B',
            textColor: '#FFFFFF',
            icon: '🎁',
            description: 'Voucher giảm giá 100.000đ cho đơn hàng từ 300.000đ',
            quantity: 50,
            remaining: 32,
            probability: 15,
            claimed: 18,
        },
        {
            id: 2,
            name: 'Voucher 50.000đ',
            type: 'voucher',
            value: 50000,
            color: '#EF4444',
            textColor: '#FFFFFF',
            icon: '🎟️',
            description: 'Voucher giảm giá 50.000đ cho đơn hàng từ 150.000đ',
            quantity: 100,
            remaining: 78,
            probability: 25,
            claimed: 22,
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
            claimed: 44,
        },
        {
            id: 4,
            name: 'Bộ ấm trà',
            type: 'product',
            color: '#8B5CF6',
            textColor: '#FFFFFF',
            icon: '🍵',
            description: 'Bộ ấm trà handmade cao cấp',
            quantity: 10,
            remaining: 4,
            probability: 5,
            claimed: 6,
        },
        {
            id: 5,
            name: 'Tượng Ngựa Phong Thủy',
            type: 'product',
            color: '#F97316',
            textColor: '#FFFFFF',
            icon: '🐎',
            description: 'Tượng phong thủy may mắn năm Bính Ngọ',
            quantity: 5,
            remaining: 2,
            probability: 2,
            claimed: 3,
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
            claimed: 111,
        },
    ]);

    const [winners, setWinners] = useState<Winner[]>([
        {
            id: 1,
            userId: 101,
            name: 'Nguyễn Thị Hoa',
            email: 'hoa.nguyen@email.com',
            phone: '0987654321',
            prize: 'Voucher 100.000đ',
            prizeId: 1,
            date: '2026-01-15 10:30:00',
            spinCount: 3,
            claimed: true,
            claimedDate: '2026-01-16',
        },
        {
            id: 2,
            name: 'Trần Văn Lộc',
            email: 'loc.tran@email.com',
            phone: '0978123456',
            prize: 'Bộ ấm trà',
            prizeId: 4,
            date: '2026-01-15 14:20:00',
            spinCount: 5,
            claimed: false,
        },
        {
            id: 3,
            name: 'Lê Thị Xuân',
            email: 'xuan.le@email.com',
            phone: '0965234789',
            prize: 'Miễn phí vận chuyển',
            prizeId: 3,
            date: '2026-01-15 09:15:00',
            spinCount: 2,
            claimed: true,
            claimedDate: '2026-01-15',
        },
        {
            id: 4,
            name: 'Phạm Văn Thành',
            email: 'thanh.pham@email.com',
            phone: '0945678901',
            prize: 'Voucher 50.000đ',
            prizeId: 2,
            date: '2026-01-14 16:45:00',
            spinCount: 4,
            claimed: false,
        },
        {
            id: 5,
            name: 'Đỗ Thị Mai',
            email: 'mai.do@email.com',
            phone: '0978123490',
            prize: 'Tượng Ngựa Phong Thủy',
            prizeId: 5,
            date: '2026-01-14 11:00:00',
            spinCount: 7,
            claimed: true,
            claimedDate: '2026-01-14',
        },
        {
            id: 6,
            name: 'Hoàng Văn Nam',
            email: 'nam.hoang@email.com',
            phone: '0965111222',
            prize: 'Cảm ơn',
            prizeId: 6,
            date: '2026-01-14 08:30:00',
            spinCount: 1,
            claimed: false,
        },
    ]);

    // Spin data for analytics
    const [spinData] = useState({
        labels: ['Ngày 1', 'Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5', 'Ngày 6', 'Ngày 7'],
        spins: [45, 52, 48, 61, 55, 58, 62],
        winners: [12, 15, 13, 18, 16, 17, 19],
    });

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 500);
    }, []);

    // ===== HANDLERS =====
    const handleAddPrize = () => {
        setEditingPrize(null);
        setShowPrizeModal(true);
    };

    const handleEditPrize = (prize: GamePrize) => {
        setEditingPrize(prize);
        setShowPrizeModal(true);
    };

    const handleDeletePrize = async (prizeId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa giải thưởng này?')) {
            try {
                setPrizes(prizes.filter(p => p.id !== prizeId));
                notify.success('Đã xóa giải thưởng');
            } catch (error) {
                notify.error('Xóa thất bại');
            }
        }
    };

    const handleSavePrize = async (formData: Partial<GamePrize>) => {
        try {
            if (editingPrize) {
                // Update
                setPrizes(prizes.map(p => 
                    p.id === editingPrize.id ? { ...p, ...formData } as GamePrize : p
                ));
                notify.success('Cập nhật giải thưởng thành công');
            } else {
                // Create
                const newPrize: GamePrize = {
                    id: Math.max(...prizes.map(p => p.id)) + 1,
                    name: formData.name || '',
                    type: formData.type || 'none',
                    value: formData.value,
                    color: formData.color || '#6B7280',
                    textColor: '#FFFFFF',
                    icon: formData.icon || '🎁',
                    description: formData.description || '',
                    quantity: formData.quantity || 0,
                    remaining: formData.quantity || 0,
                    probability: formData.probability || 0,
                    claimed: 0,
                };
                setPrizes([...prizes, newPrize]);
                notify.success('Thêm giải thưởng thành công');
            }
            setShowPrizeModal(false);
            setEditingPrize(null);
        } catch (error) {
            notify.error('Lưu thất bại');
        }
    };

    const handleToggleGameStatus = async () => {
        const newStatus = gameConfig.status === 'active' ? 'inactive' : 'active';
        try {
            setGameConfig({ ...gameConfig, status: newStatus });
            notify.success(`Đã ${newStatus === 'active' ? 'bật' : 'tắt'} vòng quay`);
        } catch (error) {
            notify.error('Thao tác thất bại');
        }
    };

    const handleResetStats = async () => {
        if (window.confirm('Bạn có chắc chắn muốn reset toàn bộ thống kê? Hành động này không thể hoàn tác!')) {
            try {
                setGameStats({
                    totalSpins: 0,
                    totalWinners: 0,
                    totalGifts: 0,
                    activePlayers: 0,
                    todaySpins: 0,
                    conversionRate: 0,
                });
                notify.success('Đã reset thống kê');
            } catch (error) {
                notify.error('Reset thất bại');
            }
        }
    };

    const handleClaimPrize = async (winnerId: number) => {
        try {
            setWinners(winners.map(w => 
                w.id === winnerId 
                    ? { ...w, claimed: true, claimedDate: new Date().toISOString().split('T')[0] }
                    : w
            ));
            notify.success('Đã xác nhận trao thưởng');
        } catch (error) {
            notify.error('Xác nhận thất bại');
        }
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getTypeText = (type: GamePrize['type']) => {
        const texts = {
            voucher: 'Voucher giảm giá',
            product: 'Sản phẩm',
            discount: 'Giảm giá',
            none: 'Cảm ơn',
        };
        return texts[type];
    };

    const getProbabilityColor = (probability: number) => {
        if (probability >= 30) return 'var(--success)';
        if (probability >= 15) return 'var(--warning)';
        return 'var(--error)';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang tải dữ liệu game...</p>
            </div>
        );
    }

    return (
        <div className="games-container">
            {/* Header */}
            <div className="games-header">
                <div className="games-title-wrapper">
                    <h1 className="games-title">
                        🎡 Quản Lý Mini Game
                    </h1>
                    <div className={`game-status-badge ${gameConfig.status === 'active' ? 'active' : 'inactive'}`}>
                        {gameConfig.status === 'active' ? (
                            <>
                                <PlayIcon className="w-3 h-3" />
                                Đang hoạt động
                            </>
                        ) : (
                            <>
                                <StopIcon className="w-3 h-3" />
                                Tạm dừng
                            </>
                        )}
                    </div>
                </div>
                <p className="games-subtitle">
                    Quản lý vòng quay may mắn Tết Bính Ngọ 2026 - Cấu hình giải thưởng, theo dõi người chơi
                </p>
            </div>

            {/* Stats Cards */}
            <div className="games-stats-grid">
                <div className="game-stat-card">
                    <div className="stat-header-game">
                        <span className="stat-title-game">Tổng lượt quay</span>
                        <GiftIcon className="stat-icon-game" />
                    </div>
                    <div className="stat-value-game">{gameStats.totalSpins.toLocaleString()}</div>
                    <div className="stat-trend positive">+{gameStats.todaySpins} hôm nay</div>
                </div>

                <div className="game-stat-card">
                    <div className="stat-header-game">
                        <span className="stat-title-game">Người trúng thưởng</span>
                        <TrophyIcon className="stat-icon-game" />
                    </div>
                    <div className="stat-value-game">{gameStats.totalWinners.toLocaleString()}</div>
                    <div className="stat-trend positive">Tỷ lệ {gameStats.conversionRate}%</div>
                </div>

                <div className="game-stat-card">
                    <div className="stat-header-game">
                        <span className="stat-title-game">Quà đã trao</span>
                        <UsersIcon className="stat-icon-game" />
                    </div>
                    <div className="stat-value-game">{gameStats.totalGifts.toLocaleString()}</div>
                    <div className="stat-trend">{prizes.reduce((sum, p) => sum + p.claimed, 0)} đã nhận</div>
                </div>

                <div className="game-stat-card">
                    <div className="stat-header-game">
                        <span className="stat-title-game">Đang chơi</span>
                        <CalendarIcon className="stat-icon-game" />
                    </div>
                    <div className="stat-value-game">{gameStats.activePlayers}</div>
                    <div className="stat-trend">Lượt quay hôm nay</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="games-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'prizes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prizes')}
                >
                    <GiftIcon className="tab-icon" />
                    Giải thưởng
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`}
                    onClick={() => setActiveTab('winners')}
                >
                    <TrophyIcon className="tab-icon" />
                    Người trúng thưởng
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    <SparklesIcon className="tab-icon" />
                    Cấu hình
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <ChartBarIcon className="tab-icon" />
                    Thống kê
                </button>
            </div>

            {/* Tab Content: Prizes */}
            {activeTab === 'prizes' && (
                <div className="prizes-section">
                    <div className="section-header-game">
                        <div>
                            <h3 className="section-title-game">Danh Sách Giải Thưởng</h3>
                            <p className="section-subtitle-game">Quản lý các giải thưởng trong vòng quay</p>
                        </div>
                        <button className="create-prize-btn" onClick={handleAddPrize}>
                            <PlusIcon className="w-4 h-4" />
                            Thêm giải thưởng
                        </button>
                    </div>

                    <div className="prizes-grid">
                        {prizes.map((prize) => (
                            <div key={prize.id} className="prize-card" style={{ borderTopColor: prize.color }}>
                                <div className="prize-card-header">
                                    <div className="prize-icon" style={{ background: prize.color }}>
                                        <span>{prize.icon}</span>
                                    </div>
                                    <div className="prize-info">
                                        <h4 className="prize-name">{prize.name}</h4>
                                        <span className="prize-type">{getTypeText(prize.type)}</span>
                                    </div>
                                    <div className="prize-actions">
                                        <button className="prize-action-btn edit" onClick={() => handleEditPrize(prize)}>
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button className="prize-action-btn delete" onClick={() => handleDeletePrize(prize.id)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="prize-card-body">
                                    <p className="prize-description">{prize.description}</p>
                                    
                                    <div className="prize-stats">
                                        <div className="prize-stat">
                                            <span className="stat-label">Số lượng</span>
                                            <span className="stat-value">{prize.quantity}</span>
                                        </div>
                                        <div className="prize-stat">
                                            <span className="stat-label">Còn lại</span>
                                            <span className="stat-value" style={{ color: prize.remaining > 0 ? 'var(--success)' : 'var(--error)' }}>
                                                {prize.remaining}
                                            </span>
                                        </div>
                                        <div className="prize-stat">
                                            <span className="stat-label">Đã trao</span>
                                            <span className="stat-value">{prize.claimed}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="probability-section">
                                        <div className="probability-header">
                                            <span className="probability-label">Tỷ lệ trúng</span>
                                            <span className="probability-value" style={{ color: getProbabilityColor(prize.probability) }}>
                                                {prize.probability}%
                                            </span>
                                        </div>
                                        <div className="probability-bar">
                                            <div 
                                                className="probability-fill" 
                                                style={{ width: `${prize.probability}%`, background: prize.color }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    {prize.value && (
                                        <div className="prize-value">
                                            Giá trị: {prize.type === 'voucher' ? formatCurrency(prize.value) : `${prize.value}%`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Content: Winners */}
            {activeTab === 'winners' && (
                <div className="winners-section">
                    <div className="section-header-game">
                        <div>
                            <h3 className="section-title-game">Người Trúng Thưởng</h3>
                            <p className="section-subtitle-game">Danh sách người chơi may mắn</p>
                        </div>
                        <div className="winner-filters">
                            <select className="filter-select">
                                <option value="all">Tất cả</option>
                                <option value="claimed">Đã nhận quà</option>
                                <option value="unclaimed">Chưa nhận</option>
                            </select>
                            <input type="text" className="filter-input" placeholder="Tìm kiếm..." />
                        </div>
                    </div>

                    <div className="winners-table-container">
                        <table className="winners-table">
                            <thead>
                                <tr>
                                    <th>Người chơi</th>
                                    <th>Giải thưởng</th>
                                    <th>Số lượt quay</th>
                                    <th>Ngày trúng</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {winners.map((winner) => {
                                    const prize = prizes.find(p => p.id === winner.prizeId);
                                    return (
                                        <tr key={winner.id}>
                                            <td>
                                                <div className="winner-info">
                                                    <div className="winner-avatar">
                                                        {winner.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="winner-name">{winner.name}</div>
                                                        <div className="winner-contact">{winner.email || winner.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="winner-prize" style={{ color: prize?.color }}>
                                                    <span>{prize?.icon}</span>
                                                    <span>{winner.prize}</span>
                                                </div>
                                            </td>
                                            <td>{winner.spinCount}</td>
                                            <td>{winner.date.split(' ')[0]}</td>
                                            <td>
                                                <span className={`claim-status ${winner.claimed ? 'claimed' : 'pending'}`}>
                                                    {winner.claimed ? 'Đã nhận' : 'Chưa nhận'}
                                                </span>
                                            </td>
                                            <td>
                                                {!winner.claimed && (
                                                    <button 
                                                        className="claim-btn"
                                                        onClick={() => handleClaimPrize(winner.id)}
                                                    >
                                                        Xác nhận trao
                                                    </button>
                                                )}
                                                <button 
                                                    className="view-btn"
                                                    onClick={() => setSelectedWinner(winner)}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab Content: Configuration */}
            {activeTab === 'config' && (
                <div className="config-section">
                    <div className="config-card">
                        <div className="config-header">
                            <h3>Cấu hình vòng quay</h3>
                            <button 
                                className={`game-toggle-btn ${gameConfig.status === 'active' ? 'active' : 'inactive'}`}
                                onClick={handleToggleGameStatus}
                            >
                                {gameConfig.status === 'active' ? (
                                    <>
                                        <StopIcon className="w-4 h-4" />
                                        Tạm dừng game
                                    </>
                                ) : (
                                    <>
                                        <PlayIcon className="w-4 h-4" />
                                        Kích hoạt game
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div className="config-body">
                            <div className="form-group">
                                <label>Tên game</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={gameConfig.name}
                                    onChange={(e) => setGameConfig({ ...gameConfig, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    className="form-input"
                                    rows={3}
                                    value={gameConfig.description}
                                    onChange={(e) => setGameConfig({ ...gameConfig, description: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ngày bắt đầu</label>
                                    <input 
                                        type="date" 
                                        className="form-input"
                                        value={gameConfig.startDate}
                                        onChange={(e) => setGameConfig({ ...gameConfig, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ngày kết thúc</label>
                                    <input 
                                        type="date" 
                                        className="form-input"
                                        value={gameConfig.endDate}
                                        onChange={(e) => setGameConfig({ ...gameConfig, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giới hạn lượt quay/người</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        value={gameConfig.spinLimit}
                                        onChange={(e) => setGameConfig({ ...gameConfig, spinLimit: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Lượt quay miễn phí/ngày</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        value={gameConfig.freeSpinPerDay}
                                        onChange={(e) => setGameConfig({ ...gameConfig, freeSpinPerDay: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Màu chủ đạo</label>
                                    <input 
                                        type="color" 
                                        className="form-input"
                                        value={gameConfig.theme.primaryColor}
                                        onChange={(e) => setGameConfig({ 
                                            ...gameConfig, 
                                            theme: { ...gameConfig.theme, primaryColor: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Màu phụ</label>
                                    <input 
                                        type="color" 
                                        className="form-input"
                                        value={gameConfig.theme.secondaryColor}
                                        onChange={(e) => setGameConfig({ 
                                            ...gameConfig, 
                                            theme: { ...gameConfig.theme, secondaryColor: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={gameConfig.requireLogin}
                                            onChange={(e) => setGameConfig({ ...gameConfig, requireLogin: e.target.checked })}
                                        />
                                        <span>Yêu cầu đăng nhập để quay</span>
                                    </label>
                                </div>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={gameConfig.allowMultipleSpin}
                                            onChange={(e) => setGameConfig({ ...gameConfig, allowMultipleSpin: e.target.checked })}
                                        />
                                        <span>Cho phép quay nhiều lần</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="config-footer">
                            <button className="btn btn-primary" onClick={() => {
                                notify.success('Đã lưu cấu hình');
                            }}>
                                Lưu cấu hình
                            </button>
                            <button className="btn btn-danger" onClick={handleResetStats}>
                                Reset thống kê
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Analytics */}
            {activeTab === 'analytics' && (
                <div className="analytics-section">
                    <div className="analytics-card">
                        <div className="analytics-header">
                            <h3>Thống kê lượt quay</h3>
                            <button className="refresh-btn">
                                <ArrowPathIcon className="w-4 h-4" />
                                Làm mới
                            </button>
                        </div>
                        
                        <div className="chart-container">
                            <div className="simple-chart">
                                <div className="chart-legend">
                                    <div className="legend-item">
                                        <div className="legend-color spins"></div>
                                        <span>Lượt quay</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color winners"></div>
                                        <span>Người trúng</span>
                                    </div>
                                </div>
                                <div className="chart-bars">
                                    {spinData.labels.map((label, index) => (
                                        <div key={index} className="chart-bar-group">
                                            <div className="chart-bar-wrapper">
                                                <div 
                                                    className="chart-bar spins" 
                                                    style={{ height: `${(spinData.spins[index] / Math.max(...spinData.spins)) * 100}%` }}
                                                >
                                                    <span className="bar-value">{spinData.spins[index]}</span>
                                                </div>
                                                <div 
                                                    className="chart-bar winners" 
                                                    style={{ height: `${(spinData.winners[index] / Math.max(...spinData.winners)) * 100}%` }}
                                                >
                                                    <span className="bar-value">{spinData.winners[index]}</span>
                                                </div>
                                            </div>
                                            <div className="chart-label">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="stats-summary">
                        <div className="summary-card">
                            <div className="summary-title">Tỷ lệ trúng thưởng trung bình</div>
                            <div className="summary-value">{((gameStats.totalWinners / gameStats.totalSpins) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-title">Giải thưởng phổ biến nhất</div>
                            <div className="summary-value">
                                {prizes.reduce((prev, current) => (prev.claimed > current.claimed) ? prev : current).name}
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-title">Thời điểm quay nhiều nhất</div>
                            <div className="summary-value">20:00 - 22:00</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prize Modal */}
            {showPrizeModal && (
                <div className="modal-overlay" onClick={() => setShowPrizeModal(false)}>
                    <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPrize ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng mới'}</h3>
                            <button className="modal-close" onClick={() => setShowPrizeModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Tên giải thưởng</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    defaultValue={editingPrize?.name}
                                    id="prizeName"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Loại giải thưởng</label>
                                <select className="form-input" id="prizeType" defaultValue={editingPrize?.type}>
                                    <option value="voucher">Voucher giảm giá</option>
                                    <option value="product">Sản phẩm</option>
                                    <option value="discount">Giảm giá</option>
                                    <option value="none">Cảm ơn</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Biểu tượng</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    defaultValue={editingPrize?.icon}
                                    id="prizeIcon"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    className="form-input" 
                                    rows={3}
                                    defaultValue={editingPrize?.description}
                                    id="prizeDescription"
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Số lượng</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        defaultValue={editingPrize?.quantity}
                                        id="prizeQuantity"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tỷ lệ trúng (%)</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        defaultValue={editingPrize?.probability}
                                        id="prizeProbability"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Màu sắc</label>
                                <input 
                                    type="color" 
                                    className="form-input"
                                    defaultValue={editingPrize?.color || '#c41e3a'}
                                    id="prizeColor"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowPrizeModal(false)}>Hủy</button>
                            <button className="btn-submit" onClick={() => {
                                const name = (document.getElementById('prizeName') as HTMLInputElement)?.value;
                                const type = (document.getElementById('prizeType') as HTMLSelectElement)?.value as GamePrize['type'];
                                const icon = (document.getElementById('prizeIcon') as HTMLInputElement)?.value;
                                const description = (document.getElementById('prizeDescription') as HTMLTextAreaElement)?.value;
                                const quantity = Number((document.getElementById('prizeQuantity') as HTMLInputElement)?.value);
                                const probability = Number((document.getElementById('prizeProbability') as HTMLInputElement)?.value);
                                const color = (document.getElementById('prizeColor') as HTMLInputElement)?.value;
                                
                                handleSavePrize({ name, type, icon, description, quantity, probability, color });
                            }}>
                                {editingPrize ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Winner Detail Modal */}
            {selectedWinner && (
                <div className="modal-overlay" onClick={() => setSelectedWinner(null)}>
                    <div className="winner-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết người trúng thưởng</h3>
                            <button className="modal-close" onClick={() => setSelectedWinner(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="winner-detail">
                                <div className="detail-item">
                                    <label>Họ tên:</label>
                                    <span>{selectedWinner.name}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{selectedWinner.email || '---'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Số điện thoại:</label>
                                    <span>{selectedWinner.phone || '---'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Giải thưởng:</label>
                                    <span className="prize-highlight">{selectedWinner.prize}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Số lượt quay:</label>
                                    <span>{selectedWinner.spinCount}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ngày trúng:</label>
                                    <span>{selectedWinner.date}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Trạng thái:</label>
                                    <span className={`claim-status ${selectedWinner.claimed ? 'claimed' : 'pending'}`}>
                                        {selectedWinner.claimed ? 'Đã nhận quà' : 'Chưa nhận quà'}
                                    </span>
                                </div>
                                {selectedWinner.claimedDate && (
                                    <div className="detail-item">
                                        <label>Ngày nhận:</label>
                                        <span>{selectedWinner.claimedDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {!selectedWinner.claimed && (
                                <button className="btn-submit" onClick={() => {
                                    handleClaimPrize(selectedWinner.id);
                                    setSelectedWinner(null);
                                }}>
                                    Xác nhận trao thưởng
                                </button>
                            )}
                            <button className="btn-cancel" onClick={() => setSelectedWinner(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Games;