// src/providers/CacheProvider.tsx - File MỚI
import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/cacheService';
import '../services/apiInterceptor'; // Auto activate interceptor

// Component wrapper - có thể wrap ở root hoặc không cũng được
export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    console.log('🚀 Cache system initialized');
    
    // Auto clear cache when tab is closed
    window.addEventListener('beforeunload', () => {
      sessionStorage.clear();
    });
    
    return () => {
      // Cleanup
      window.removeEventListener('beforeunload', () => {});
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};