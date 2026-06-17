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
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '../../types/model';

/* ---------- icons thay thế deprecated ---------- */
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12H9m0 0 3-3m-3 3 3 3" />
    </svg>
);

const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

const navigation = [
    { name: 'Tổng Quan',      href: '/admin',            icon: HomeIcon },
    { name: 'Sản Phẩm',       href: '/admin/products',   icon: ShoppingBagIcon },
    { name: 'Đơn Hàng',       href: '/admin/orders',     icon: ShoppingCartIcon },
    { name: 'Người Dùng',     href: '/admin/users',      icon: UsersIcon },
    { name: 'Mini Game',      href: '/admin/games',      icon: PuzzlePieceIcon },
    { name: 'Thống Kê',       href: '/admin/analytics',  icon: ChartBarIcon },
    { name: 'Chatbox',        href: '/admin/promotions', icon: TagIcon },
    { name: 'Cài Đặt',        href: '/admin/settings',   icon: CogIcon },
];

interface SidebarProps {
    currentUser: User;
    onLogout: () => void;
    onBackToSite?: () => void;
    isMobile?: boolean;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentUser,
    onLogout,
    onBackToSite,
    isMobile = false,
    mobileOpen = false,
    onMobileClose,
}) => {
    const [collapsed, setCollapsed] = useState(false);

    /* --- safe fallbacks để tránh crash khi user chưa load xong --- */
    const username    = currentUser?.username  ?? 'Admin';
    const email       = currentUser?.email     ?? '';
    const roles       = currentUser?.roles     ?? [];
    const userInitial = username.charAt(0).toUpperCase();

    useEffect(() => {
        if (isMobile) setCollapsed(true);
    }, [isMobile]);

    const sidebarClass = [
        'admin-sidebar',
        collapsed   ? 'collapsed'    : '',
        mobileOpen  ? 'mobile-open'  : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={sidebarClass}>
            {/* ── LOGO ── */}
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
                    <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
                        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                )}

                {isMobile && mobileOpen && (
                    <button className="sidebar-toggle" onClick={onMobileClose}>
                        <XMarkIcon />
                    </button>
                )}
            </div>

            {/* ── NAV ── */}
            <nav className="sidebar-nav">
                {navigation.map((item, i) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === '/admin'}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        onClick={() => isMobile && onMobileClose?.()}
                        style={{ animationDelay: `${i * 0.04}s` }}
                        title={collapsed ? item.name : undefined}
                    >
                        <item.icon className="nav-icon" />
                        {!collapsed && <span className="nav-text">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* ── FOOTER ── */}
            <div className="sidebar-footer">
                {/* User card */}
                <div className="sidebar-user">
                    <div className="user-avatar">{userInitial}</div>
                    {!collapsed && (
                        <div className="user-info">
                            <p className="user-name">{username}</p>
                            {email && <p className="user-email">{email}</p>}
                            {roles.length > 0 && (
                                <div className="user-roles">
                                    {roles.map(role => (
                                        <span key={role} className="user-role-badge">
                                            {role.replace('ROLE_', '')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Về trang người dùng */}
                <button
                    className="sidebar-action-btn sidebar-back-btn"
                    onClick={onBackToSite}
                    title="Về trang người dùng"
                >
                    <BackIcon className="btn-icon" />
                    {!collapsed && <span>Về trang người dùng</span>}
                </button>

                {/* Đăng xuất */}
                <button
                    className="sidebar-action-btn sidebar-logout-btn"
                    onClick={onLogout}
                    title="Đăng xuất"
                >
                    <LogoutIcon className="btn-icon" />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;