import '../styles/index.css';
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import { User } from '../../types/model';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [globalLoading, setGlobalLoading] = useState<boolean>(true);

    // Đọc user thật từ localStorage
    const [currentUser, setCurrentUser] = useState<User>(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.id) return parsed;
            }
        } catch {}
        // Fallback an toàn nếu parse lỗi
        return {
            id: 0,
            username: 'Admin',
            email: '',
            roles: ['ADMIN'],
        };
    });

    useEffect(() => {
        const timer = setTimeout(() => setGlobalLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Logout: xóa toàn bộ auth data, dispatch event để App.tsx cập nhật state, về login
    const handleLogout = (): void => {
        // 1. Xóa storage
        localStorage.removeItem('user');
        localStorage.removeItem('authHeader');
        localStorage.removeItem('userEmail');
        // 2. Dispatch custom event để App.tsx lắng nghe và setCurrentUser(null)
        window.dispatchEvent(new Event('auth:logout'));
        // 3. Navigate về login
        navigate('/login', { replace: true });
    };

    // Quay lại trang người dùng mà không logout
    const handleBackToSite = (): void => {
        navigate('/');
    };

    return (
        <div className="admin-layout" style={{ position: 'relative' }}>
            {globalLoading && (
                <div id="loading-screen">
                    <div className="loading-screen-spinner"></div>
                </div>
            )}

            <Sidebar
                currentUser={currentUser}
                onLogout={handleLogout}
                onBackToSite={handleBackToSite}
            />

            <div className="admin-main">
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;