// src/admin/hooks/useSuperDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import api from './api';

export interface HandmadeKPI {
    totalUsers: { value: number; label: string };
    totalProducts: { value: number; label: string };
    totalOrders: { value: number; label: string };
    totalRevenue: { value: number; label: string };
    totalReviews: { value: number; label: string };
    totalWishlists: { value: number; label: string };
    todayOrders: { value: number; label: string };
    canceledOrders: { value: number; label: string };
}

export interface TopProduct {
    name: string;
    category_name: string;
    image_url: string;
    sold: number;
    revenue: number;
}

export interface TopCategory {
    name: string;
    sold: number;
    revenue: number;
}

export interface Activity {
    time: string;
    content: string;
    type: 'order' | 'user' | 'review';
}

export interface SuperDashboardData {
    kpi: HandmadeKPI | null;
    revenueTrend: any[];
    orderStatuses: any[];
    topProducts: TopProduct[];
    topCategories: TopCategory[];
    recentOrders: any[];
    newUsers: any[];
    recentReviews: any[];
    activities: Activity[];
    notifications: any[];
    lowStock: any[];
}

export const useSuperDashboard = () => {
    const [data, setData] = useState<SuperDashboardData>({
        kpi: null,
        revenueTrend: [],
        orderStatuses: [],
        topProducts: [],
        topCategories: [],
        recentOrders: [],
        newUsers: [],
        recentReviews: [],
        activities: [],
        notifications: [],
        lowStock: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'year'>('30days');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                kpiRes,
                trendRes,
                statusRes,
                productsRes,
                categoriesRes,
                ordersRes,
                usersRes,
                reviewsRes,
                activitiesRes,
                notifRes,
                stockRes
            ] = await Promise.allSettled([
                api.get('/admin/analytics/handmade-kpi'),
                api.get(`/admin/analytics/revenue-chart?range=${dateRange}`),
                api.get('/admin/analytics/order-statuses'),
                api.get('/admin/analytics/top-handmade-products'),
                api.get('/admin/analytics/top-categories'),
                api.get('/admin/analytics/recent-orders'),
                api.get('/admin/analytics/new-users'),
                api.get('/admin/analytics/recent-reviews'),
                api.get('/admin/analytics/recent-activities'),
                api.get('/admin/analytics/notifications'),
                api.get('/admin/analytics/low-stock-alert?threshold=5')
            ]);

            const getValue = (res: any) => res.status === 'fulfilled' ? res.value.data : [];

            setData({
                kpi: kpiRes.status === 'fulfilled' ? kpiRes.value.data : null,
                revenueTrend: getValue(trendRes),
                orderStatuses: getValue(statusRes),
                topProducts: getValue(productsRes),
                topCategories: getValue(categoriesRes),
                recentOrders: getValue(ordersRes),
                newUsers: getValue(usersRes),
                recentReviews: getValue(reviewsRes),
                activities: getValue(activitiesRes),
                notifications: getValue(notifRes),
                lowStock: getValue(stockRes),
            });
        } catch (err) {
            console.error('SuperDashboard fetch error:', err);
            setError('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const refresh = () => fetchAll();

    return {
        data,
        loading,
        error,
        dateRange,
        setDateRange,
        refresh,
    };
};