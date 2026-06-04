// src/services/apiInterceptor.ts - File MỚI
import axios from 'axios';

// Extend axios config to include custom cache properties
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __cachedResponse?: any;
  }
}

// Cache storage
const apiCache = new Map();

// Hàm cache response
function cacheResponse(url: string, data: any, ttl = 300000) {
  apiCache.set(url, {
    data,
    timestamp: Date.now(),
    ttl,
  });
  
  // Auto clear after TTL
  setTimeout(() => {
    apiCache.delete(url);
    console.log(`Cache expired: ${url}`);
  }, ttl);
}

// Axios interceptor - TỰ ĐỘNG cache mà không cần sửa component
axios.interceptors.request.use(async (config) => {
  // Only cache GET requests
  if (config.method === 'get' && config.url?.includes('/api/')) {
    const cacheKey = config.url;
    
    // Check cache
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      // Cancel actual request and return cached data
      const cancelToken = axios.CancelToken.source();
      config.cancelToken = cancelToken.token;
      cancelToken.cancel('Using cached data');
      
      // Return cached data via custom property
      config.__cachedResponse = cached.data;
    }
  }
  return config;
});

// Response interceptor - Cache response
axios.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && response.config.url?.includes('/api/')) {
      const cacheKey = response.config.url;
      cacheResponse(cacheKey, response.data);
    }
    return response;
  },
  (error) => {
    // Return cached data if request was cancelled
    if (axios.isCancel(error) && (error.config as any)?.__cachedResponse) {
      return Promise.resolve({ data: (error.config as any).__cachedResponse });
    }
    return Promise.reject(error);
  }
);

// Export function to clear cache manually if needed
export const clearApiCache = (urlPattern?: string) => {
  if (urlPattern) {
    const keys = Array.from(apiCache.keys());
    for (const key of keys) {
      if (key.includes(urlPattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
  console.log('API Cache cleared');
};