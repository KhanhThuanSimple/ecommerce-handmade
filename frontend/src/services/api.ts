import axios from 'axios';

const getStoredAccount = () => {
    const keys = ['user', 'adminUser', 'currentUser', 'authUser'];

    for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            // ignore invalid JSON and continue
        }
    }

    return null;
};

const getAdminIdForRequest = () => {
    const account = getStoredAccount();
    const id = account?.id ?? account?.userId ?? account?.adminId ?? account?.user?.id ?? account?.admin?.id;
    return id ? String(id) : '';
};

const getTokenFromStorage = () => {
    const authHeader = localStorage.getItem('authHeader');
    if (authHeader) return authHeader;

    const account = getStoredAccount();
    return account?.token || account?.accessToken || account?.jwt || account?.authToken || '';
};

const api = axios.create({
    // Mặc định /api + setupProxy.js (dev) hoặc http://localhost:8080/api (production build)
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        config.headers = config.headers ?? {};

        const isAuthEndpoint =
            config.url?.includes('/auth/login') ||
            config.url?.includes('/auth/register');

        if (!isAuthEndpoint) {
            const token = getTokenFromStorage();

            if (token) {
                config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            if (config.url?.startsWith('/admin/') || config.url?.includes('/admin/')) {
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

export default api;