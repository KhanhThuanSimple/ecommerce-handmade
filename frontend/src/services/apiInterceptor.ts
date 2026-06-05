import axios from 'axios';

const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCache = (key: string) => {
  const cached = apiCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    apiCache.delete(key);
    return null;
  }

  return cached.data;
};

const setCache = (key: string, data: any, ttl = 300000) => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

// =====================
// REQUEST INTERCEPTOR
// =====================
axios.interceptors.request.use((config) => {
  if (config.method === 'get' && config.url?.includes('/api/')) {
    const cacheKey = config.url;

    const cachedData = getCache(cacheKey);

    // 🔥 KHÔNG CANCEL REQUEST NỮA
    // chỉ gắn flag để xử lý ở response
    (config as any).__cacheKey = cacheKey;
    (config as any).__cachedData = cachedData;
  }

  return config;
});

// =====================
// RESPONSE INTERCEPTOR
// =====================
axios.interceptors.response.use(
  (response) => {
    const cacheKey = (response.config as any).__cacheKey;

    if (cacheKey) {
      setCache(cacheKey, response.data);
    }

    return response;
  },
  (error) => {
    // ❌ CHẶN CANCEL ERROR HOÀN TOÀN
    if (
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.message?.includes('cached')
    ) {
      console.warn('Blocked cancel/cache error');
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);