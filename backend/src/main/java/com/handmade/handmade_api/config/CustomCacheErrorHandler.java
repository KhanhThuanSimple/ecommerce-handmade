package com.handmade.handmade_api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Bộ xử lý lỗi Cache tùy chỉnh: khi Redis bị tắt hoặc mất kết nối,
 * hệ thống ghi nhận log cảnh báo thay vì báo lỗi hệ thống (crash),
 * cho phép ứng dụng truy vấn thẳng xuống cơ sở dữ liệu.
 */
public class CustomCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Lỗi đọc từ cache '{}' với key '{}': {}. Hệ thống sẽ truy vấn xuống database.", 
                cache.getName(), key, exception.getMessage());
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("Lỗi ghi vào cache '{}' với key '{}': {}.", 
                cache.getName(), key, exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Lỗi xóa phần tử khỏi cache '{}' với key '{}': {}.", 
                cache.getName(), key, exception.getMessage());
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.warn("Lỗi xóa toàn bộ dữ liệu trong cache '{}': {}.", 
                cache.getName(), exception.getMessage());
    }
}
