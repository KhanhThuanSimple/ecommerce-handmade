// admin/layouts/AdminLayout.tsx

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { User } from '../../types/model';

import '../styles/admin.css';

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {

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
        <div className="admin-layout">
            <Sidebar 
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            <div className="admin-main">
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;