// src/services/adminOrder.service.ts
import api from './api';
import { AxiosResponse } from 'axios';

export interface AdminOrderFilterRequest {
  orderId?: string;
  userId?: number;
  phone?: string;
  orderStatus?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  quantity: number;
}

export interface OrderHistoryResponse {
  action: string;
  oldStatus: string;
  newStatus: string;
  note: string;
  performedBy: string;
  performedByRole: string;
  performedAt: string;
}

export interface OrderResponse {
  id: string;
  userId: number;
  fullName: string;
  customerEmail: string;
  phone: string;
  address: string;
  items: OrderItemResponse[];
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  voucherCode: string;
  paymentMethod: string;
  status: string;
  date: string;
  createdAt?: string;
  history?: OrderHistoryResponse[];
}

export interface AdminOrderSummaryResponse {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  paymentMethodStats: Record<string, number>;
  topProducts: Record<string, number>;
  dailyRevenue: Record<string, number>;
}

export interface OrderUpdateRequest {
  orderStatus?: string;
  shippingStatus?: string;
  paymentStatus?: string;
  note?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
}

class AdminOrderService {
  private getAdminId(): string {
    const candidates = ['user', 'adminUser', 'currentUser', 'authUser'];

    for (const key of candidates) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const id = parsed?.id ?? parsed?.userId ?? parsed?.adminId ?? parsed?.user?.id ?? parsed?.admin?.id;
        if (id) return String(id);
      } catch {
        // ignore invalid JSON
      }
    }

    return '';
  }

  async getOrders(filter: AdminOrderFilterRequest): Promise<AxiosResponse<{ content: OrderResponse[]; totalElements: number; totalPages: number; number: number; size: number }>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return api.get(`/admin/orders?${params.toString()}`, {
      headers: { 'adminId': this.getAdminId() }
    });
  }

  async getOrderSummary(): Promise<AxiosResponse<AdminOrderSummaryResponse>> {
    return api.get('/admin/orders/summary', {
      headers: { 'adminId': this.getAdminId() }
    });
  }

  async getOrderDetail(orderId: string): Promise<AxiosResponse<OrderResponse>> {
    return api.get(`/admin/orders/${orderId}`, {
      headers: { 'adminId': this.getAdminId() }
    });
  }

  async updateOrderStatus(orderId: string, updateRequest: OrderUpdateRequest): Promise<AxiosResponse<OrderResponse>> {
    return api.put(`/admin/orders/${orderId}/status`, updateRequest, {
      headers: { 'adminId': this.getAdminId() }
    });
  }

  async cancelOrder(orderId: string, reason: string): Promise<AxiosResponse<OrderResponse>> {
    return api.post(`/admin/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, null, {
      headers: { 'adminId': this.getAdminId() }
    });
  }
}

const adminOrderService = new AdminOrderService();

export default adminOrderService;