// admin/layouts/Sidebar.tsx
import React, { useState, useEffect } from 'react';
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
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '../../types/model';

const navigation = [
    { name: 'Tổng Quan', href: '/admin', icon: HomeIcon },
    { name: 'Sản Phẩm', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Đơn Hàng', href: '/admin/orders', icon: ShoppingCartIcon },
    { name: 'Người Dùng', href: '/admin/users', icon: UsersIcon },
    { name: 'Mini Game', href: '/admin/games', icon: PuzzlePieceIcon },
    { name: 'Thống Kê', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Quản lý ChatBox', href: '/admin/promotions', icon: TagIcon },
    { name: 'Cài Đặt', href: '/admin/settings', icon: CogIcon },
];

interface SidebarProps {
    currentUser: User;
    onLogout: () => void;
    isMobile?: boolean;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentUser, 
    onLogout, 
    isMobile = false, 
    mobileOpen = false,
    onMobileClose 
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const userInitial = currentUser.username.charAt(0).toUpperCase();

    // Auto collapse on mobile
    useEffect(() => {
        if (isMobile) {
            setCollapsed(true);
        }
    }, [isMobile]);

    const sidebarClasses = `admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`;

    return (
        <div className={sidebarClasses}>
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <GiftIcon className="logo-icon" />
                    {!collapsed && (
                        <div className="logo-text">
                            <span className="logo-main">Handmade</span>
                            <span className="logo-sub">Admin Panel</span>
                        </div>
                    )}
                </div>
                {!isMobile && (
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                )}
                {isMobile && mobileOpen && (
                    <button 
                        className="sidebar-toggle"
                        onClick={onMobileClose}
                    >
                        <XMarkIcon />
                    </button>
                )}
            </div>
            
            <nav className="sidebar-nav">
                {navigation.map((item, index) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        onClick={() => isMobile && onMobileClose?.()}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <item.icon className="nav-icon" />
                        {!collapsed && <span className="nav-text">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>
            
            <div className="sidebar-footer">
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
                                    <span key={role} className="user-role-badge">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <div className="tet-banner">
                        <div className="tet-banner-content">
                            <span className="tet-icon">🐎</span>
                            <div>
                                <p className="tet-subtitle">Năm Bính Ngọ 2026</p>
                                <p className="tet-title">Mã Đáo Thành Công</p>
                            </div>
                        </div>
                        <div className="tet-decoration"></div>
                    </div>
                )}

                <button 
                    className="sidebar-logout"
                    onClick={onLogout}
                >
                    <ArrowRightOnRectangleIcon className="logout-icon" />
                    {!collapsed && <span>Quay lại homepage</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;