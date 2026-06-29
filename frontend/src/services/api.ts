import axios from 'axios';

/**
 * =========================
 * ACCOUNT HELPERS
 * =========================
 */
const getStoredAccount = () => {
    const keys = ['user', 'adminUser', 'currentUser', 'authUser'];

    for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {}
    }

    return null;
};

export const getUserId = (user?: any): any => {
    if (user) {
        const id = user.id ?? user.userId ?? user.adminId ?? user.user?.id ?? user.admin?.id;
        if (id) return id;
    }
    const account = getStoredAccount();
    return account?.id ?? account?.userId ?? account?.adminId ?? account?.user?.id ?? account?.admin?.id;
};

const getTokenFromStorage = () => {
    const rawToken = localStorage.getItem('authHeader');

    if (rawToken) return rawToken;

    const account = getStoredAccount();

    const token =
        account?.token ||
        account?.accessToken ||
        account?.jwt ||
        account?.authToken ||
        '';

    return token.startsWith('Bearer ')
        ? token
        : token
        ? `Bearer ${token}`
        : '';
};

const getAdminIdForRequest = () => {
    const account = getStoredAccount();

    const id =
        account?.id ??
        account?.userId ??
        account?.adminId ??
        account?.user?.id ??
        account?.admin?.id;

    return id ? String(id) : '';
};

/**
 * =========================
 * AXIOS INSTANCE
 * =========================
 */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 15000, // tăng timeout tránh false cancel
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * =========================
 * REQUEST INTERCEPTOR
 * =========================
 */
api.interceptors.request.use(
    (config) => {
        config.headers = config.headers || {};

        const isAuthEndpoint =
            config.url?.includes('/auth/login') ||
            config.url?.includes('/auth/register');

        if (!isAuthEndpoint) {
            const token = getTokenFromStorage();

            if (token) {
                config.headers.Authorization = token;
            }

            if (config.url?.includes('/admin/')) {
                const adminId = getAdminIdForRequest();
                if (adminId) {
                    config.headers['adminId'] = adminId;
                }
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * =========================
 * RESPONSE INTERCEPTOR (FIX CACHED + CANCEL ERROR)
 * =========================
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🔥 CHẶN TRIỆT ĐỂ CANCELED ERROR (NGUYÊN NHÂN CHÍNH)
        if (
            error?.code === 'ERR_CANCELED' ||
            error?.name === 'CanceledError' ||
            error?.message?.toLowerCase?.().includes('cached') ||
            error?.message?.toLowerCase?.().includes('canceled')
        ) {
            console.warn('🚫 Ignored cached/canceled request:', error.message);

            // KHÔNG THROW ERROR → tránh crash React
            return new Promise(() => {});
        }

        // 🔐 Unauthorized — xóa toàn bộ auth data để tránh phantom token
        if (error?.response?.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('authHeader');
            localStorage.removeItem('userEmail');
            // Không redirect ở đây để tránh vòng lặp nếu trang public — để App.tsx xử lý
        }

        return Promise.reject(error);
    }
);

export default api;