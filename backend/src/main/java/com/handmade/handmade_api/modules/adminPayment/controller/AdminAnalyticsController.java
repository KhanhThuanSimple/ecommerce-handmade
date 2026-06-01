package com.handmade.handmade_api.modules.adminPayment.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin/analytics")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final JdbcTemplate jdbcTemplate;

    public AdminAnalyticsController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 1. API KPI: Tự động hóa tham số range ('today', 'month', 'year', 'all')
     * thay vì tính toán gom hết toàn bộ lịch sử.
     */
    @GetMapping("/kpi")
    public ResponseEntity<?> getKPIData(@RequestParam(defaultValue = "month") String range) {
        try {
            // Xây dựng điều kiện thời gian động (Dynamic SQL Filter)
            String timeCondition = " WHERE 1=1";
            if ("today".equalsIgnoreCase(range)) {
                timeCondition += " AND created_at >= CURRENT_DATE";
            } else if ("month".equalsIgnoreCase(range)) {
                timeCondition += " AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
            } else if ("year".equalsIgnoreCase(range)) {
                timeCondition += " AND created_at >= CURRENT_DATE - INTERVAL '1 year'";
            }

            // A. Tính toán doanh thu thực tế dựa trên khoảng thời gian
            String sqlRevenue = "SELECT COALESCE(SUM(payable_amount), 0) FROM orders " + timeCondition + " AND status = 'COMPLETED'";
            Double totalRevenue = jdbcTemplate.queryForObject(sqlRevenue, Double.class);

            // B. Tổng số đơn thành công trong kỳ
            String sqlSuccessOrders = "SELECT COUNT(*) FROM orders " + timeCondition + " AND status = 'COMPLETED'";
            Integer successOrdersCount = jdbcTemplate.queryForObject(sqlSuccessOrders, Integer.class);

            // C. Tổng số đơn phát sinh (để tính toán tỷ lệ vận hành)
            String sqlTotalOrders = "SELECT COUNT(*) FROM orders " + timeCondition;
            Integer totalOrdersCount = jdbcTemplate.queryForObject(sqlTotalOrders, Integer.class);

            // D. Số lượng khách mua thực tế (Active Customers)
            String sqlActiveCustomers = "SELECT COUNT(DISTINCT user_id) FROM orders " + timeCondition + " AND status = 'COMPLETED'";
            Integer activeCustomers = jdbcTemplate.queryForObject(sqlActiveCustomers, Integer.class);

            // E. Tổng thành viên hệ thống (Không lọc thời gian để giữ số quy mô tổng)
            String sqlTotalUsers = "SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role_id = 4";
            Integer totalUsers = jdbcTemplate.queryForObject(sqlTotalUsers, Integer.class);

            // F. Đếm số đơn hủy / lỗi
            String sqlCanceledOrders = "SELECT COUNT(*) FROM orders " + timeCondition + " AND status IN ('CANCELED', 'FAILED')";
            Integer canceledOrdersCount = jdbcTemplate.queryForObject(sqlCanceledOrders, Integer.class);

            // --- TÍNH TOÁN CÁC CHỈ SỐ KINH DOANH SÂU ---
            Double averageOrderValue = successOrdersCount > 0 ? (totalRevenue / successOrdersCount) : 0.0;
            Double cancellationRate = totalOrdersCount > 0 ? ((double) canceledOrdersCount / totalOrdersCount * 100) : 0.0;
            Double conversionRate = totalUsers > 0 ? ((double) activeCustomers / totalUsers * 100) : 0.0;

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("revenue", Map.of("value", totalRevenue, "label", "Tổng doanh thu thực tế (VND)"));
            data.put("successOrders", Map.of("value", successOrdersCount, "label", "Đơn hàng hoàn thành"));
            data.put("aov", Map.of("value", Math.round(averageOrderValue * 100.0) / 100.0, "label", "Giá trị trung bình đơn (AOV)"));
            data.put("activeCustomers", Map.of("value", activeCustomers, "label", "Khách hàng phát sinh giao dịch"));
            data.put("conversionRate", Map.of("value", Math.round(conversionRate * 10.0) / 10.0, "label", "Tỷ lệ chuyển đổi thành viên (%)"));
            data.put("cancellationRate", Map.of("value", Math.round(cancellationRate * 10.0) / 10.0, "label", "Tỷ lệ hủy đơn (%)"));

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống thống kê KPI: " + e.getMessage());
        }
    }

    /**
     * 2. API Lấy top sản phẩm bán chạy nhất mang lại doanh thu cao nhất
     */
    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts() {
        try {
            String sql = "SELECT oi.product_id, oi.product_name, " +
                    "SUM(oi.quantity) as total_quantity_sold, " +
                    "SUM(oi.price * oi.quantity) as total_revenue_generated " +
                    "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                    "WHERE o.status = 'COMPLETED' " +
                    "GROUP BY oi.product_id, oi.product_name " +
                    "ORDER BY total_revenue_generated DESC LIMIT 5";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi lấy top sản phẩm: " + e.getMessage());
        }
    }

    /**
     * 3. CHỨC NĂNG BỔ SUNG: Báo động sản phẩm sắp cháy kho (Low Stock Alert)
     */
    @GetMapping("/low-stock-alert")
    public ResponseEntity<?> getLowStockProducts(@RequestParam(defaultValue = "5") Integer threshold) {
        try {
            String sql = "SELECT p.id as product_id, p.name as product_name, pv.variant_name, pv.sku, pv.inventory " +
                    "FROM product_variants pv JOIN products p ON pv.product_id = p.id " +
                    "WHERE pv.inventory <= ? " +
                    "ORDER BY pv.inventory ASC";

            List<Map<String, Object>> lowStockItems = jdbcTemplate.queryForList(sql, threshold);
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi lấy danh sách sản phẩm sắp hết kho: " + e.getMessage());
        }
    }

    /**
     * 4. BIỂU ĐỒ ĐƯỜNG/CỘT: Biến động xu hướng doanh thu (Revenue Trend trong 30 ngày)
     */
    @GetMapping("/revenue-trend")
    public ResponseEntity<?> getRevenueTrend() {
        try {
            String sql = "SELECT DATE(created_at) as date_label, COALESCE(SUM(payable_amount), 0) as daily_revenue " +
                    "FROM orders " +
                    "WHERE status = 'COMPLETED' AND created_at >= CURRENT_DATE - INTERVAL '30 days' " +
                    "GROUP BY DATE(created_at) " +
                    "ORDER BY date_label ASC";

            List<Map<String, Object>> trendData = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(trendData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi lấy tiến trình biểu đồ doanh thu: " + e.getMessage());
        }
    }

    /**
     * 5. BIỂU ĐỒ TRÒN: Phân tích nhóm trạng thái người dùng (User distribution)
     * Phục vụ đắc lực cho phân khúc tiếp thị (Marketing Cohort)
     */
    @GetMapping("/user-status-distribution")
    public ResponseEntity<?> getUserStatusDistribution() {
        try {
            String sql = "SELECT " +
                    "  COUNT(CASE WHEN order_count = 0 THEN 1 END) as inactive_users, " +
                    "  COUNT(CASE WHEN order_count = 1 THEN 1 END) as new_customers, " +
                    "  COUNT(CASE WHEN order_count >= 2 THEN 1 END) as loyal_customers " +
                    "FROM (" +
                    "  SELECT u.id, COUNT(o.id) as order_count " +
                    "  FROM users u " +
                    "  JOIN user_roles ur ON u.id = ur.user_id " +
                    "  LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'COMPLETED' " +
                    "  WHERE ur.role_id = 4 " +
                    "  GROUP BY u.id" +
                    ") as user_order_stats";

            Map<String, Object> result = jdbcTemplate.queryForMap(sql);

            List<Map<String, Object>> chartData = new ArrayList<>();
            chartData.add(Map.of("name", "User chưa từng mua hàng", "value", result.get("inactive_users"), "color", "#9ca3af"));
            chartData.add(Map.of("name", "Khách hàng mới (1 đơn)", "value", result.get("new_customers"), "color", "#3b82f6"));
            chartData.add(Map.of("name", "Khách hàng thân thiết (>=2 đơn)", "value", result.get("loyal_customers"), "color", "#10b981"));

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi phân tích hành vi user: " + e.getMessage());
        }
    }

    /**
     * 6. BIỂU ĐỒ FUNNEL/CỘT: Quản trị vận hành chuỗi trạng thái đơn hàng (Order Lifecycle)
     */
    @GetMapping("/order-status-funnel")
    public ResponseEntity<?> getOrderStatusFunnel() {
        try {
            String sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC";
            List<Map<String, Object>> funnelData = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(funnelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi phân tích chuỗi trạng thái đơn hàng: " + e.getMessage());
        }
    }

    /**
     * 7. THỐNG KÊ RỦI RO: Phân tích tỉ lệ Giỏ hàng bị bỏ rơi (Abandoned Carts Analytics)
     */
    @GetMapping("/abandoned-carts")
    public ResponseEntity<?> getAbandonedCartsAnalytics() {
        try {
            // Giỏ hàng được định nghĩa là bị bỏ rơi nếu có hàng nhưng user không tạo đơn COMPLETED nào trong 7 ngày qua
            String sqlCarts = "SELECT COUNT(DISTINCT c.id) FROM carts c " +
                    "JOIN cart_items ci ON c.id = ci.cart_id " +
                    "WHERE c.id NOT IN (SELECT DISTINCT user_id FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')";
            Integer abandonedCartsCount = jdbcTemplate.queryForObject(sqlCarts, Integer.class);

            // Tính tổng số lượng sản phẩm đang bị nằm chờ, nghẽn trong giỏ hàng
            String sqlItems = "SELECT COALESCE(SUM(quantity), 0) FROM cart_items";
            Integer totalProductsStuck = jdbcTemplate.queryForObject(sqlItems, Integer.class);

            // Ước lượng giá trị tiềm năng bị treo dựa trên base_price của sản phẩm
            String sqlPotentialLoss = "SELECT COALESCE(SUM(p.base_price * ci.quantity), 0) FROM cart_items ci " +
                    "JOIN products p ON ci.product_id = p.id";
            Double potentialLossValue = jdbcTemplate.queryForObject(sqlPotentialLoss, Double.class);

            Map<String, Object> metrics = new LinkedHashMap<>();
            metrics.put("abandonedCartsCount", abandonedCartsCount);
            metrics.put("totalProductsStuck", totalProductsStuck);
            metrics.put("potentialLossValue", potentialLossValue);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi phân tích dữ liệu giỏ hàng rác: " + e.getMessage());
        }
    }
}