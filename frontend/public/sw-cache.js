// public/sw-cache.js - File MỚI
const CACHE_NAME = 'api-cache-v1';
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

self.addEventListener('fetch', (event) => {
  // Only cache API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          const cachedTime = cachedResponse.headers.get('sw-cache-time');
          if (cachedTime && Date.now() - parseInt(cachedTime) < API_CACHE_TTL) {
            console.log('⚡ Service Worker cache hit');
            return cachedResponse;
          }
        }
        
        const response = await fetch(event.request);
        const responseClone = response.clone();
        const headers = new Headers(responseClone.headers);
        headers.set('sw-cache-time', Date.now().toString());
        
        const newResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers: headers,
        });
        
        cache.put(event.request, newResponse);
        return response;
      })
    );
  }
});