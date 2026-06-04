// src/admin/hooks/useSuperDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface KPIMetric {
    value: number;
    label: string;
}

export interface KPIResponse {
    revenue: KPIMetric;
    successOrders: KPIMetric;
    aov: KPIMetric;
    activeCustomers: KPIMetric;
    conversionRate: KPIMetric;
    cancellationRate: KPIMetric;
}

export interface TopProduct {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
    percentage: number;
}

export interface LowStockItem {
    sku: string;
    product_name: string;
    variant_name: string;
    inventory: number;
}

export interface AbandonedCartMetric {
    abandonedCartsCount: number;
    totalProductsStuck: number;
    potentialLossValue: number;
}

export interface RecentOrder {
    id: string;
    fullName: string;
    payableAmount: number;
    status: string;
    date: string;
}

export interface PaymentMethodStatus {
    code: string;
    name: string;
    is_active: boolean;
}

export interface UserRoleDistribution {
    name: string;
    value: number;
    color: string;
}

export interface SuperDashboardData {
    kpi: KPIResponse | null;
    revenueTrend: any[];
    topProducts: TopProduct[];
    lowStockAlerts: LowStockItem[];
    abandonedCart: AbandonedCartMetric | null;
    recentOrders: RecentOrder[];
    paymentMethods: PaymentMethodStatus[];
    userDistribution: UserRoleDistribution[];
}

export const useSuperDashboard = () => {
    const [data, setData] = useState<SuperDashboardData>({
        kpi: null,
        revenueTrend: [],
        topProducts: [],
        lowStockAlerts: [],
        abandonedCart: null,
        recentOrders: [],
        paymentMethods: [],
        userDistribution: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'today' | 'month' | 'year'>('month');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                kpiRes,
                trendRes,
                productsRes,
                lowStockRes,
                abandonedRes,
                ordersRes,
                paymentRes,
                userDistRes,
            ] = await Promise.allSettled([
                api.get(`/admin/analytics/kpi?range=${dateRange}`),
                api.get('/admin/analytics/revenue-trend'),
                api.get('/admin/analytics/top-products'),
                api.get('/admin/analytics/low-stock-alert?threshold=5'),
                api.get('/admin/analytics/abandoned-carts'),
                api.get('/admin/orders?page=0&size=5&sortBy=createdAt&sortDirection=DESC'),
                api.get('/payment/admin/methods'),
                api.get('/admin/analytics/user-status-distribution'),
            ]);

            // Xử lý an toàn từng promise
            const kpi = kpiRes.status === 'fulfilled' ? kpiRes.value.data : null;
            const revenueTrend = trendRes.status === 'fulfilled' ? trendRes.value.data : [];
            const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
            const lowStockAlerts = lowStockRes.status === 'fulfilled' ? lowStockRes.value.data : [];
            const abandonedCart = abandonedRes.status === 'fulfilled' ? abandonedRes.value.data : null;
            const paymentMethods = paymentRes.status === 'fulfilled' ? paymentRes.value.data : [];
            const userDistribution = userDistRes.status === 'fulfilled' ? userDistRes.value.data : [];

            // Xử lý top products
            const totalRevenueGenerated = rawProducts.reduce((sum: number, item: any) => sum + (item.total_revenue_generated || 0), 0);
            const topProducts = rawProducts.map((item: any) => ({
                id: item.product_id,
                name: item.product_name,
                quantity: item.total_quantity_sold,
                revenue: item.total_revenue_generated,
                percentage: totalRevenueGenerated > 0 ? Math.round((item.total_revenue_generated / totalRevenueGenerated) * 100) : 0
            }));

            // Xử lý recent orders
            let recentOrders: RecentOrder[] = [];
            if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.content) {
                recentOrders = ordersRes.value.data.content.slice(0, 5).map((order: any) => ({
                    id: order.id,
                    fullName: order.fullName,
                    payableAmount: order.payableAmount,
                    status: order.status,
                    date: order.date || order.createdAt,
                }));
            }

            setData({
                kpi,
                revenueTrend,
                topProducts,
                lowStockAlerts,
                abandonedCart,
                recentOrders,
                paymentMethods,
                userDistribution,
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