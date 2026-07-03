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
 * RESPONSE INTERCEPTOR
 * =========================
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Bỏ qua lỗi cancel do user navigate đi — không crash UI
        if (
            error?.code === 'ERR_CANCELED' ||
            error?.name === 'CanceledError'
        ) {
            // Trả về null thay vì treo promise — component tự handle
            return Promise.resolve(null);
        }

        // 🔐 Unauthorized — xóa auth data
        if (error?.response?.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('authHeader');
            localStorage.removeItem('userEmail');
        }

        return Promise.reject(error);
    }
);

export default api;