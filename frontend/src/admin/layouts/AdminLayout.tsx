import '../styles/index.css';
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

import Sidebar from '../components/Sidebar';
import { User } from '../../types/model';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [globalLoading, setGlobalLoading] = useState<boolean>(true);
    const [exportToast, setExportToast] = React.useState<{msg: string, type: 'success'|'info'|'error', fileName?: string} | null>(null);

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
        
        // Kết nối WebSocket chung cho toàn bộ giao diện Admin
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/topic/admin-notifications', (message) => {
                    const payload = JSON.parse(message.body);
                    setExportToast({ msg: payload.message, type: 'success', fileName: payload.fileName });
                    setTimeout(() => setExportToast(null), 10000); // 10s to let them click
                });
            }
        });
        client.activate();

        return () => {
            clearTimeout(timer);
            client.deactivate();
        };
    }, []);

    // Lắng nghe CustomEvent từ các trang con (VD: Dashboard) để hiện Toast mượt mà thay vì dùng alert
    useEffect(() => {
        const handleGlobalToast = (e: Event) => {
            const customEvent = e as CustomEvent;
            setExportToast(customEvent.detail);
            if (customEvent.detail && customEvent.detail.type === 'info') {
                setTimeout(() => setExportToast(null), 3000);
            }
        };
        window.addEventListener('global-toast', handleGlobalToast);
        return () => window.removeEventListener('global-toast', handleGlobalToast);
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
            
            {/* Export Toast Global */}
            {exportToast && (
                <div style={{
                    position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
                    backgroundColor: exportToast.type === 'error' ? '#ef4444' : exportToast.type === 'success' ? '#10b981' : '#3b82f6',
                    color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        {exportToast.type === 'success' ? <CheckCircleIcon className="w-6 h-6"/> : <ExclamationTriangleIcon className="w-6 h-6"/>}
                        {exportToast.msg}
                    </div>
                    {exportToast.fileName && (
                        <a 
                            href={`http://localhost:8080/api/admin/analytics/download-report/${exportToast.fileName}`} 
                            target="_blank" rel="noreferrer"
                            style={{
                                color: '#fff', textDecoration: 'underline', alignSelf: 'flex-start', marginLeft: '32px', fontSize: '0.9rem'
                            }}
                        >
                            Tải file {exportToast.fileName}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminLayout;