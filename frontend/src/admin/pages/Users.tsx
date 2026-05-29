import React, { useState, useEffect } from 'react';
import {
    UserCircleIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    LockOpenIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    UserPlusIcon,
    EnvelopeIcon,
    PhoneIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

import useUsers from '../hooks/useUsers';
import { User } from '../types/userAdmins';

import '../styles/users.css';

const Users: React.FC = () => {
    const {
        loading,
        page,
        setPage,
        paginatedUsers,
        totalPages,
        stats,
        updating,
        addUser, 
        toggleLock,     
        toggleStatus,     
        updateUserRoles, 
        deleteUser,
        refreshData,
        availableRoles,
        addSystemRole,
        deleteSystemRole
    } = useUsers();

    // Hệ thống quản lý trạng thái đóng/mở các cửa sổ Modals
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showAddRoleModal, setShowAddRoleModal] = useState<boolean>(false); 
    const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState<boolean>(false);
    const [selectedRoleIdToDelete, setSelectedRoleIdToDelete] = useState<string>(''); // Lưu ID vai trò được chọn từ dropdown
    
    // State dữ liệu Form Thêm người dùng mới
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        roles: ['ROLE_USER']
    });

    // State dữ liệu Form Thêm vai trò mới
    const [newRole, setNewRole] = useState({
        name: '',
        displayName: '',
        color: '#3b82f6'
    });

    // Cơ chế kết nối và lắng nghe dữ liệu thời gian thực qua WebSockets
    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws'); 
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                stompClient.subscribe('/topic/users', (message) => {
                    if (message.body === 'USER_DATA_CHANGED') {
                        refreshData(); 
                    }
                });
            }
        });
        stompClient.activate();
        return () => {
            stompClient.deactivate();
        };
    }, [refreshData]);

    useEffect(() => {
        if (selectedUser) {
            setSelectedRoles(selectedUser.roles || []);
        }
    }, [selectedUser, showRoleModal]);

    const handleRoleCheckboxChange = (roleName: string) => {
        setSelectedRoles((prev: string[]) =>
            prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
        );
    };

    const handleAddModalRoleChange = (roleName: string) => {
        setNewUser(prev => {
            const currentRoles = prev.roles || [];
            const updatedRoles = currentRoles.includes(roleName)
                ? currentRoles.filter(r => r !== roleName)
                : [...currentRoles, roleName];
            return { ...prev, roles: updatedRoles };
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewRole(prev => ({ ...prev, [name]: value }));
    };

    // Nộp form tạo tài khoản thành viên
    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...newUser,
            roles: newUser.roles && newUser.roles.length > 0 ? newUser.roles : ["ROLE_USER"]
        };

        addUser(payload, () => {
            setShowAddModal(false); 
            setNewUser({ username: '', email: '', password: '', fullName: '', phone: '', roles: ['ROLE_USER'] }); 
        });
    };

    const handleAddRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addSystemRole(newRole);
            setShowAddRoleModal(false);
            setNewRole({ name: '', displayName: '', color: '#3b82f6' }); 
        } catch (err) {
            console.error("Lỗi khi tạo vai trò:", err);
        }
    };

    // Hàm xử lý kích hoạt xóa vai trò từ Form Dropdown chọn lựa
    const handleConfirmDeleteRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoleIdToDelete) {
            alert('Vui lòng chọn một vai trò cụ thể để thực hiện xóa!');
            return;
        }

        const roleObj = availableRoles.find(r => r.id === Number(selectedRoleIdToDelete));
        if (roleObj && (roleObj.name === 'ROLE_ADMIN' || roleObj.name === 'ROLE_USER')) {
            alert('Không thể xóa vai trò hệ thống mặc định!');
            return;
        }

        try {
            await deleteSystemRole(Number(selectedRoleIdToDelete));
            setShowDeleteRoleConfirm(false);
            setSelectedRoleIdToDelete('');
        } catch (err) {
            console.error('Lỗi khi xóa vai trò hệ thống:', err);
        }
    };

    return (
        <div className="users-page">
            {/* 1. Header Section */}
            <div className="users-header">
                <div className="users-title-wrapper">
                    <div className="title-badge">
                        <UserCircleIcon className="title-icon" />
                        <span className="badge-text">Quản trị viên</span>
                    </div>
                    <h1 className="users-title">Quản Lý Người Dùng</h1>
                    <p className="users-subtitle">Quản lý phân quyền động, thiết lập trạng thái tài khoản thời gian thực</p>
                </div>
                <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            {/* 2. Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <UserCircleIcon className="stat-icon" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Tổng người dùng</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <CheckCircleIcon className="stat-icon" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.active}</div>
                        <div className="stat-label">Đang hoạt động</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper red">
                        <LockClosedIcon className="stat-icon" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.locked}</div>
                        <div className="stat-label">Đang bị khóa</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <ShieldCheckIcon className="stat-icon" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.admin}</div>
                        <div className="stat-label">Quản trị viên</div>
                    </div>
                </div>
            </div>

            {/* 3. Panel Quản lý Danh mục Quyền Hệ thống Động */}
            <div className="role-management-panel">
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>⚙️ Danh Mục Vai Trò Hệ Thống (Real-time DB)</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {availableRoles.map(role => (
                        <div key={role.id} className="role-dynamic-item" style={{ borderLeft: `4px solid ${role.color || '#cbd5e1'}` }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
                                {role.displayName} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '11px' }}>({role.name})</span>
                            </span>
                            {role.name !== 'ROLE_ADMIN' && role.name !== 'ROLE_USER' && (
                                <button 
                                    onClick={() => { setSelectedRoleIdToDelete(String(role.id)); setShowDeleteRoleConfirm(true); }}
                                    className="role-delete-btn"
                                    disabled={updating}
                                    title="Xóa bỏ vai trò này"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <button 
                        onClick={() => setShowAddRoleModal(true)}
                        disabled={updating}
                        style={{ padding: '1px 24px', borderRadius: '15px', border: '1px dashed #3b82f6', color: '#3b82f6', background: '#fff', fontWeight: 300, cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Thêm vai trò mới</span>
                    </button>
                    
                    {/* ✨ ĐÃ FIX: Nút xóa tổng quan kích hoạt Modal chọn danh sách vai trò từ FE để xóa */}
                    <button 
                        onClick={() => setShowDeleteRoleConfirm(true)}
                        disabled={updating}
                        style={{ padding: '1px 24px', borderRadius: '15px', border: '1px dashed #ef4444', color: '#ef4444', background: '#fff', fontWeight: 300, cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Xóa vai trò</span>
                    </button>
                </div>
            </div>

            {/* 4. Table UI */}
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Thông tin liên hệ</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Thao tác độc lập</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="empty-row">
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <ArrowPathIcon className="w-6 h-6 spinning text-gray-400" />
                                            <div className="empty-title">Đang đồng bộ dữ liệu từ PostgreSQL...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-icon">👥</div>
                                            <div className="empty-title">Không tìm thấy thành viên nào</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user: User) => (
                                    <tr key={user.id} className="user-row">
                                        <td data-label="Người dùng">
                                            <div className="user-info">
                                                <div className="user-avatar-wrapper">
                                                    <div className="user-avatar">
                                                        {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    {user.enabled && <span className="online-dot"></span>}
                                                </div>
                                                <div className="user-details">
                                                    <div className="user-name">
                                                        {user.fullName || user.username}
                                                        {user.roles?.includes('ROLE_ADMIN') && (
                                                            <CheckBadgeIcon className="verified-badge" />
                                                        )}
                                                    </div>
                                                    <div className="user-username">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Liên hệ">
                                            <div className="user-email">
                                                <EnvelopeIcon className="inline-icon" />
                                                <span className="contact-text">{user.email}</span>
                                            </div>
                                            <div className="user-phone">
                                                <PhoneIcon className="inline-icon" />
                                                <span>{user.phone || 'Chưa cập nhật'}</span>
                                            </div>
                                        </td>
                                        <td data-label="Vai trò">
                                            <div className="roles-container" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {user.roles && user.roles.map((roleString) => {
                                                    const dbRole = availableRoles.find(r => r.name === roleString);
                                                    const badgeColor = dbRole ? dbRole.color : '#6b7280';
                                                    const badgeLabel = dbRole ? dbRole.displayName : roleString;

                                                    return (
                                                        <span 
                                                            key={roleString} 
                                                            className="role-badge"
                                                            style={{ 
                                                                backgroundColor: `${badgeColor}15`, 
                                                                color: badgeColor, 
                                                                border: `1px solid ${badgeColor}40`,
                                                            }}
                                                        >
                                                            <ShieldCheckIcon className="w-3 h-3" /> 
                                                            {badgeLabel}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td data-label="Trạng thái">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className={`status-tag-custom ${user.accountNonLocked ? 'active' : 'locked'}`}>
                                                    {user.accountNonLocked ? '🔓 Mở khóa' : '🔒 Đang khóa'}
                                                </span>
                                                <span className={`status-tag-custom ${user.enabled ? 'active' : 'inactive'}`}>
                                                    {user.enabled ? '✅ Kích hoạt' : '❌ Vô hiệu'}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Thao tác">
                                            <div className="action-buttons">
                                                <button 
                                                    className={`action-icon ${user.accountNonLocked ? 'unlock' : 'lock'}`}
                                                    onClick={() => toggleLock(user.id)} 
                                                    disabled={updating}
                                                    title={user.accountNonLocked ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                    style={{ color: user.accountNonLocked ? '#3b82f6' : '#ef4444' }}
                                                >
                                                    {user.accountNonLocked ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                                </button>
                                                
                                                <button 
                                                    className="action-icon status"
                                                    onClick={() => toggleStatus(user.id)} 
                                                    disabled={updating}
                                                    title={user.enabled ? "Vô hiệu hóa hoạt động" : "Kích hoạt hoạt động"}
                                                    style={{ color: user.enabled ? '#10b981' : '#64748b' }}
                                                >
                                                    <CheckBadgeIcon className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    className="action-icon shield"
                                                    onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                                                    title="Thay đổi vai trò"
                                                >
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    className="action-icon delete"
                                                    onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }}
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 5. Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Hiển thị trang <strong>{page}</strong> trên tổng số <strong>{totalPages}</strong> trang
                        </div>
                        <div className="pagination-controls">
                            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeftIcon className="w-4 h-4" />
                                <span>Trước</span>
                            </button>
                            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                <span>Sau</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CỬA SỔ MODAL 1: Thêm Người Dùng Mới */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <UserPlusIcon className="modal-icon" />
                                <h3>Thêm người dùng mới</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUserSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tên đăng nhập <span className="required">*</span></label>
                                        <input type="text" name="username" required placeholder="vd: nguyenvanA" value={newUser.username} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email <span className="required">*</span></label>
                                        <input type="email" name="email" required placeholder="example@email.com" value={newUser.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu <span className="required">*</span></label>
                                        <input type="password" name="password" required placeholder="••••••••" value={newUser.password} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Họ và tên <span className="required">*</span></label>
                                        <input type="text" name="fullName" required placeholder="Nguyễn Văn A" value={newUser.fullName} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Số điện thoại</label>
                                        <input type="text" name="phone" placeholder="0987654321" value={newUser.phone} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Vai trò hệ thống khởi tạo</label>
                                        <div className="role-checkbox-group">
                                            {availableRoles.map((role) => {
                                                const isChecked = newUser.roles.includes(role.name);
                                                return (
                                                    <label key={role.id} className={`role-option ${isChecked ? 'checked' : ''}`} style={{ borderLeft: `3px solid ${role.color || '#cbd5e1'}` }}>
                                                        <input type="checkbox" checked={isChecked} onChange={() => handleAddModalRoleChange(role.name)} />
                                                        <span className="role-option-label">{role.displayName}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-primary" disabled={updating}>
                                    {updating ? <ArrowPathIcon className="spinning w-4 h-4" /> : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CỬA SỔ MODAL 2: Thêm Vai Trò Hệ Thống Mới */}
            {showAddRoleModal && (
                <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
                    <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <ShieldCheckIcon className="modal-icon" />
                                <h3>Thêm vai trò hệ thống mới</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowAddRoleModal(false)}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddRoleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="form-group">
                                        <label>Mã vai trò hệ thống <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            required 
                                            placeholder="Ví dụ: ROLE_STAFF" 
                                            value={newRole.name} 
                                            onChange={handleRoleInputChange} 
                                        />
                                        <small style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', display: 'block' }}>Hệ thống tự động ép định dạng viết hoa và tiền tố "ROLE_"</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Tên vai trò hiển thị <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            name="displayName" 
                                            required 
                                            placeholder="Ví dụ: Nhân viên vận hành" 
                                            value={newRole.displayName} 
                                            onChange={handleRoleInputChange} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Màu sắc thương hiệu đại diện</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input 
                                                type="color" 
                                                name="color" 
                                                value={newRole.color} 
                                                onChange={handleRoleInputChange} 
                                                style={{ width: '42px', height: '38px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                                            />
                                            <input 
                                                type="text" 
                                                name="color" 
                                                placeholder="#3b82f6" 
                                                value={newRole.color} 
                                                onChange={handleRoleInputChange} 
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddRoleModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-primary" disabled={updating}>
                                    {updating ? <ArrowPathIcon className="spinning w-4 h-4" /> : 'Khởi tạo vai trò'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CỬA SỔ MODAL 5: Chọn vai trò từ danh sách đã load trước đó để tiến hành xóa */}
            {showDeleteRoleConfirm && (
                <div className="modal-overlay" onClick={() => { setShowDeleteRoleConfirm(false); setSelectedRoleIdToDelete(''); }}>
                    <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <TrashIcon className="modal-icon danger w-5 h-5" />
                                <h3>Xóa vai trò hệ thống</h3>
                            </div>
                            <button className="modal-close" onClick={() => { setShowDeleteRoleConfirm(false); setSelectedRoleIdToDelete(''); }}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmDeleteRole}>
                            <div className="modal-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                                            Chọn vai trò muốn gỡ bỏ hoàn toàn <span className="required">*</span>
                                        </label>
                                        <select
                                            value={selectedRoleIdToDelete}
                                            onChange={(e) => setSelectedRoleIdToDelete(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                backgroundColor: '#fff',
                                                color: '#334155',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">-- Chọn vai trò từ hệ thống --</option>
                                            {availableRoles
                                                .filter(r => r.name !== 'ROLE_ADMIN' && r.name !== 'ROLE_USER') // Ẩn quyền tối cao
                                                .map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.displayName} ({role.name})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <p className="confirm-warning" style={{ margin: 0, fontSize: '12px', color: '#ef4444', lineHeight: '1.5' }}>
                                        ⚠️ Chú ý: Khi xóa, hệ thống Database backend sẽ kích hoạt cơ chế gỡ tự động vai trò này ra khỏi tất cả các tài khoản đang sở hữu quyền liên quan.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => { setShowDeleteRoleConfirm(false); setSelectedRoleIdToDelete(''); }}>Hủy bỏ</button>
                                <button type="submit" className="btn-danger" disabled={updating || !selectedRoleIdToDelete}>
                                    {updating ? <ArrowPathIcon className="spinning w-4 h-4" /> : 'Xác nhận xóa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CỬA SỔ MODAL 3: Cấu Hình Phân Quyền Thành Viên */}
            {showRoleModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <ShieldCheckIcon className="modal-icon w-5 h-5" />
                                <h3>Cập nhật vai trò thành viên</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowRoleModal(false)}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="user-summary">
                                <div className="user-summary-avatar">{selectedUser.fullName?.charAt(0)?.toUpperCase()}</div>
                                <div className="user-summary-info">
                                    <div className="user-summary-name">{selectedUser.fullName || selectedUser.username}</div>
                                    <div className="user-summary-email">{selectedUser.email}</div>
                                </div>
                            </div>
                            <div className="roles-section">
                                <label className="section-label">Tích chọn vai trò gán xuống CSDL:</label>
                                <div className="role-options">
                                    {availableRoles.map((role) => {
                                        const isChecked = selectedRoles.includes(role.name);
                                        return (
                                            <label key={role.id} className={`role-card ${isChecked ? 'selected' : ''}`} style={{ borderLeft: `4px solid ${role.color || '#cbd5e1'}` }}>
                                                <input type="checkbox" checked={isChecked} onChange={() => handleRoleCheckboxChange(role.name)} />
                                                <div className="role-card-content">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <ShieldCheckIcon className="w-4 h-4" style={{ color: role.color }} />
                                                        <span className="role-card-name">{role.displayName}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowRoleModal(false)}>Hủy bỏ</button>
                            <button className="btn-primary" onClick={() => updateUserRoles(selectedUser.id, selectedRoles, () => setShowRoleModal(false))} disabled={updating}>
                                {updating ? <ArrowPathIcon className="spinning w-4 h-4" /> : 'Lưu cấu hình quyền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CỬA SỔ MODAL 4: Xác Nhận Xóa Tài Khoản */}
            {showDeleteConfirm && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <TrashIcon className="modal-icon danger w-5 h-5" />
                                <h3>Xác nhận xóa tài khoản</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-content">
                                <div className="confirm-icon">⚠️</div>
                                <p>Bạn có chắc chắn muốn xóa tài khoản thành viên:</p>
                                <p className="confirm-user"><strong>{selectedUser.fullName || selectedUser.username}</strong>?</p>
                                <p className="confirm-warning">Hành động này sẽ xóa vĩnh viễn dữ liệu tài khoản khỏi CSDL.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</button>
                            <button className="btn-danger" onClick={() => deleteUser(selectedUser.id, () => setShowDeleteConfirm(false))} disabled={updating}>
                                Xóa vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;