import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUserId } from '../services/api';
import { User } from '../types/model';
import { updateUserEmail, updateUserPassword } from '../services/AuthService';
import { filterVouchersForUser } from '../utils/voucherUtils';

export const useProfile = (currentUser: User | null, onLogout: () => void) => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<'info' | 'email' | 'password' | 'orders' | 'games' | 'vouchers'>('info');

    // State cho Email
    const [emailValue, setEmailValue] = useState(currentUser?.email ?? '');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // State cho Password
    const [passwordValue, setPasswordValue] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // State cho Vouchers
    const [myVouchers, setMyVouchers] = useState<any[]>([]);

    const emailChanged = useMemo(() => {
        return emailValue.trim() !== (currentUser?.email ?? '');
    }, [emailValue, currentUser?.email]);

    // Effect tải Voucher
    useEffect(() => {
        const loadMyVouchers = async () => {
            const userId = getUserId(currentUser);
            if (activeSection === 'vouchers' && userId) {
                try {
                    const [vouchersRes, ordersRes] = await Promise.all([
                        api.get('/voucher'),
                        api.get(`/orders?userId=${userId}`)
                    ]);
                    const filtered = filterVouchersForUser(vouchersRes.data, ordersRes.data, 999999999);
                    setMyVouchers(filtered);
                } catch (err) {
                    console.error("Lỗi tải voucher cá nhân:", err);
                }
            }
        };
        loadMyVouchers();
    }, [activeSection, currentUser]);

    // Xử lý cập nhật Email
    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailMessage('');
        setEmailError('');
        const trimmed = emailValue.trim();
        if (!trimmed || !trimmed.includes('@')) { setEmailError('Email không hợp lệ.'); return; }
        if (!emailChanged) { setEmailError('Bạn chưa thay đổi email.'); return; }

        try {
            setEmailLoading(true);
            const userId = getUserId(currentUser);
            if (!userId) throw new Error("Không xác định được ID người dùng.");
            const updated = await updateUserEmail(Number(userId), trimmed);
            localStorage.setItem('user', JSON.stringify(updated));
            setEmailMessage('Cập nhật email thành công. Trang sẽ tải lại.');
            setTimeout(() => window.location.reload(), 800);
        } catch (err) {
            setEmailError((err as Error).message || 'Không thể cập nhật email.');
        } finally { setEmailLoading(false); }
    };

    // Xử lý đổi mật khẩu
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');
        if (passwordValue.length < 6) { setPasswordError('Mật khẩu tối thiểu 6 ký tự.'); return; }
        if (passwordValue !== passwordConfirm) { setPasswordError('Mật khẩu không khớp.'); return; }

        try {
            setPasswordLoading(true);
            const userId = getUserId(currentUser);
            if (!userId) throw new Error("Không xác định được ID người dùng.");
            await updateUserPassword(Number(userId), passwordValue);
            setPasswordMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
            setTimeout(() => onLogout(), 1000);
        } catch (err) {
            setPasswordError((err as Error).message || 'Không thể đổi mật khẩu.');
        } finally { setPasswordLoading(false); }
    };

    return {
        activeSection, setActiveSection,
        emailValue, setEmailValue, emailMessage, emailError, emailLoading,
        passwordValue, setPasswordValue, passwordConfirm, setPasswordConfirm, passwordMessage, passwordError, passwordLoading,
        myVouchers,
        handleUpdateEmail,
        handleUpdatePassword,
        navigate
    };
};