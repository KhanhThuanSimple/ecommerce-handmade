package com.handmade.handmade_api.modules.adminorder.DTO;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AdminOrderSummaryResponse {
    private Long totalOrders;
    private Long pendingOrders;
    private Long processingOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Double totalRevenue;
    private Double todayRevenue;
    private Double thisWeekRevenue;
    private Double thisMonthRevenue;
    private Map<String, Double> paymentMethodStats;
    private Map<String, Long> topProducts;
    private Map<String, Double> dailyRevenue;
}