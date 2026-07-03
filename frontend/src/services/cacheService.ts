// cacheService.ts
// Chỉ giữ QueryClient — KHÔNG intercept window.fetch nữa vì gây stale data
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0,               // luôn coi data là stale → fetch lại khi cần
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});
