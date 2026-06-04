// src/services/cacheService.ts - File MỚI, không ảnh hưởng code cũ
import { QueryClient } from '@tanstack/react-query';

// Khởi tạo QueryClient global
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// Cache wrapper - hoạt động như proxy
class CacheService {
  private static instance: CacheService;
  private originalFetch: typeof fetch;
  
  private constructor() {
    // Save original fetch
    this.originalFetch = window.fetch;
    this.interceptFetch();
  }
  
  static getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  // Intercept all fetch requests
  private interceptFetch() {
    window.fetch = async (...args) => {
      const [url, config] = args;
      const urlStr = typeof url === 'string' ? url : url instanceof Request ? url.url : url.toString();
      
      // Only intercept GET requests to /api/
      if (config?.method === 'GET' || (!config?.method && urlStr.includes('/api/'))) {
        const cacheKey = urlStr;
        const cached = queryClient.getQueryData([cacheKey]);
        
        if (cached) {
          console.log(`⚡ Cache hit: ${urlStr}`);
          // Return cached response
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/json' }),
          });
        }
        
        // Fetch and cache
        const response = await this.originalFetch(...args);
        const clone = response.clone();
        const data = await clone.json();
        queryClient.setQueryData([cacheKey], data);
        
        // Auto clear cache after 5 minutes
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [cacheKey] });
        }, 5 * 60 * 1000);
        
        return response;
      }
      
      return this.originalFetch(...args);
    };
  }
  
  // Clear cache cho API cụ thể
  clearCache(urlPattern: string | RegExp) {
    const allQueries = queryClient.getQueryCache().getAll();
    allQueries.forEach(query => {
      const queryKey = query.queryKey[0] as string;
      if (typeof urlPattern === 'string') {
        if (queryKey.includes(urlPattern)) {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
      } else if (urlPattern.test(queryKey)) {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
  }
  
  // Clear all cache
  clearAllCache() {
    queryClient.clear();
    console.log('All cache cleared');
  }
}

export const cacheService = CacheService.getInstance();