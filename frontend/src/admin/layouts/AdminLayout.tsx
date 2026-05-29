import '../styles/index.css';
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import { User } from '../../types/model';

const AdminLayout: React.FC = () => {
    // State kiểm soát hiển thị thông báo nhỏ ngầm (ví dụ khi load trang đầu)
    const [globalLoading, setGlobalLoading] = useState<boolean>(true);

    useEffect(() => {
        const timer = setTimeout(() => setGlobalLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const currentUser: User = {
        id: 1,
        username: 'Admin Handmade',
        email: 'admin@handmade.com',
        roles: ['ADMIN'],
    };

    const handleLogout = (): void => {
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
    };

    return (
        <div className="admin-layout" style={{ position: 'relative' }}>
            
            {/* ✨ ĐẶT SONG SÔNG Ở ĐÂY: Hộp thông báo nhỏ sẽ nổi lên góc phải, 
                hoàn toàn không làm ảnh hưởng hay biến mất hệ thống Sidebar phía dưới */}
            {globalLoading && (
                <div id="loading-screen">
                    <div className="loading-screen-spinner"></div>
                </div>
            )}

            <Sidebar
                currentUser={currentUser}
                onLogout={handleLogout}
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