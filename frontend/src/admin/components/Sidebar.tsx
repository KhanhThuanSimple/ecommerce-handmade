// admin/layouts/Sidebar.tsx

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    HomeIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    UsersIcon,
    PuzzlePieceIcon,
    CogIcon,
    GiftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChartBarIcon,
    TagIcon,
    ArrowRightOnRectangleIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '../../types/model';

const navigation = [
    { name: 'Tổng Quan', href: '/admin', icon: HomeIcon },
    { name: 'Sản Phẩm', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Đơn Hàng', href: '/admin/orders', icon: ShoppingCartIcon },
    { name: 'Người Dùng', href: '/admin/users', icon: UsersIcon },
    { name: 'Mini Game', href: '/admin/games', icon: PuzzlePieceIcon },
    { name: 'Thống Kê', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Khuyến Mãi', href: '/admin/promotions', icon: TagIcon },
    { name: 'Cài Đặt', href: '/admin/settings', icon: CogIcon },
];

interface SidebarProps {
    currentUser: User;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout }) => {
    const [collapsed, setCollapsed] = useState(false);

    // Lấy chữ cái đầu tiên của username
    const userInitial = currentUser.username.charAt(0).toUpperCase();

    return (
        <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <GiftIcon className="logo-icon" />
                    {!collapsed && (
                        <h1 className="logo-text">
                            <span className="gradient-text">Handmade</span>
                            <span>Admin</span>
                        </h1>
                    )}
                </div>
                <button 
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
            </div>
            
            <nav className="sidebar-nav">
                {navigation.map((item, index) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <item.icon className="nav-icon" />
                        {!collapsed && <span className="nav-text">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>
            
            <div className="sidebar-footer">
                {/* User Info */}
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {userInitial}
                    </div>
                    {!collapsed && (
                        <div className="user-info">
                            <p className="user-name">{currentUser.username}</p>
                            <p className="user-email">{currentUser.email}</p>
                            <div className="user-roles">
                                {currentUser.roles.map(role => (
                                    <span key={role} className="role-badge">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tet Banner */}
                {!collapsed && (
                    <div className="tet-banner">
                        <div className="tet-banner-content">
                            <span className="tet-icon">🐎</span>
                            <div>
                                <p className="tet-subtitle">Năm Bính Ngọ</p>
                                <p className="tet-title">Mã Đáo Thành Công</p>
                            </div>
                        </div>
                        <div className="tet-decoration"></div>
                    </div>
                )}

                {/* Logout Button */}
                <button 
                    className="sidebar-logout"
                    onClick={onLogout}
                >
                    <ArrowRightOnRectangleIcon className="logout-icon" />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;