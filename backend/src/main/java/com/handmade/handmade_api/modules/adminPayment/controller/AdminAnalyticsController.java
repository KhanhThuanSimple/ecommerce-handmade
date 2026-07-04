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
            String sqlRevenue = "SELECT COALESCE(SUM(payable_amount), 0) FROM orders " + timeCondition + " AND status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng')";
            Double totalRevenue = jdbcTemplate.queryForObject(sqlRevenue, Double.class);

            // B. Tổng số đơn thành công trong kỳ
            String sqlSuccessOrders = "SELECT COUNT(*) FROM orders " + timeCondition + " AND status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng')";
            Integer successOrdersCount = jdbcTemplate.queryForObject(sqlSuccessOrders, Integer.class);

            // C. Tổng số đơn phát sinh (để tính toán tỷ lệ vận hành)
            String sqlTotalOrders = "SELECT COUNT(*) FROM orders " + timeCondition;
            Integer totalOrdersCount = jdbcTemplate.queryForObject(sqlTotalOrders, Integer.class);

            // D. Số lượng khách mua thực tế (Active Customers)
            String sqlActiveCustomers = "SELECT COUNT(DISTINCT user_id) FROM orders " + timeCondition + " AND status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng')";
            Integer activeCustomers = jdbcTemplate.queryForObject(sqlActiveCustomers, Integer.class);

            // E. Tổng thành viên hệ thống (Không lọc thời gian để giữ số quy mô tổng)
            String sqlTotalUsers = "SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role_id = 4";
            Integer totalUsers = jdbcTemplate.queryForObject(sqlTotalUsers, Integer.class);

            // F. Đếm số đơn hủy / lỗi
            String sqlCanceledOrders = "SELECT COUNT(*) FROM orders " + timeCondition + " AND status IN ('CANCELED', 'FAILED', 'Đã hủy', 'Thanh toán thất bại')";
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
                    "WHERE o.status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') " +
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
                    "WHERE status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') AND created_at >= CURRENT_DATE - INTERVAL '30 days' " +
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
                    "  LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') " +
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

    // ==============================================================================
    // HANDMADE DASHBOARD APIs (Mới nhất)
    // ==============================================================================

    @GetMapping("/handmade-kpi")
    public ResponseEntity<?> getHandmadeKpi() {
        try {
            String sqlUsers = "SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role_id = 4";
            Integer totalUsers = jdbcTemplate.queryForObject(sqlUsers, Integer.class);

            String sqlProducts = "SELECT COUNT(*) FROM products WHERE status = 'active'";
            Integer totalProducts = jdbcTemplate.queryForObject(sqlProducts, Integer.class);

            String sqlOrders = "SELECT COUNT(*) FROM orders";
            Integer totalOrders = jdbcTemplate.queryForObject(sqlOrders, Integer.class);

            String sqlRevenue = "SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng')";
            Double totalRevenue = jdbcTemplate.queryForObject(sqlRevenue, Double.class);

            Integer totalReviews = 0;
            try {
                totalReviews = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reviews", Integer.class);
            } catch (Exception e) {}

            Integer totalWishlists = 0;
            try {
                totalWishlists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_wishlist_items", Integer.class);
            } catch (Exception e) {}

            String sqlTodayOrders = "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE";
            Integer todayOrders = jdbcTemplate.queryForObject(sqlTodayOrders, Integer.class);

            String sqlCanceled = "SELECT COUNT(*) FROM orders WHERE status IN ('CANCELED', 'FAILED', 'Đã hủy', 'Thanh toán thất bại')";
            Integer canceledOrders = jdbcTemplate.queryForObject(sqlCanceled, Integer.class);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("totalUsers", Map.of("value", totalUsers != null ? totalUsers : 0, "label", "Tổng người dùng"));
            data.put("totalProducts", Map.of("value", totalProducts != null ? totalProducts : 0, "label", "Sản phẩm handmade"));
            data.put("totalOrders", Map.of("value", totalOrders != null ? totalOrders : 0, "label", "Tổng đơn hàng"));
            data.put("totalRevenue", Map.of("value", totalRevenue != null ? totalRevenue : 0, "label", "Tổng doanh thu"));
            data.put("totalReviews", Map.of("value", totalReviews != null ? totalReviews : 0, "label", "Tổng đánh giá"));
            data.put("totalWishlists", Map.of("value", totalWishlists != null ? totalWishlists : 0, "label", "SP Yêu thích"));
            data.put("todayOrders", Map.of("value", todayOrders != null ? todayOrders : 0, "label", "Đơn hôm nay"));
            data.put("canceledOrders", Map.of("value", canceledOrders != null ? canceledOrders : 0, "label", "Đơn bị hủy"));

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error KPI: " + e.getMessage());
        }
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<?> getRevenueChartRange(@RequestParam(defaultValue = "30days") String range) {
        try {
            String timeCondition = " created_at >= CURRENT_DATE - INTERVAL '30 days'";
            if ("today".equals(range)) {
                timeCondition = " DATE(created_at) = CURRENT_DATE";
            } else if ("7days".equals(range)) {
                timeCondition = " created_at >= CURRENT_DATE - INTERVAL '7 days'";
            } else if ("year".equals(range)) {
                timeCondition = " created_at >= CURRENT_DATE - INTERVAL '1 year'";
            }

            String sql = "SELECT DATE(created_at) as date_label, COALESCE(SUM(payable_amount), 0) as daily_revenue " +
                    "FROM orders " +
                    "WHERE status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') AND " + timeCondition + " " +
                    "GROUP BY DATE(created_at) ORDER BY date_label ASC";

            List<Map<String, Object>> trendData = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(trendData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error Revenue Chart: " + e.getMessage());
        }
    }

    @GetMapping("/order-statuses")
    public ResponseEntity<?> getOrderStatusChart() {
        try {
            String sql = "SELECT status as name, COUNT(*) as value FROM orders GROUP BY status";
            List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/top-handmade-products")
    public ResponseEntity<?> getTopHandmadeProducts() {
        try {
            String sql = "SELECT p.name, c.name as category_name, " +
                    "(SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image_url, " +
                    "SUM(oi.quantity) as sold, SUM(oi.price * oi.quantity) as revenue " +
                    "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                    "JOIN products p ON oi.product_id = p.id " +
                    "LEFT JOIN categories c ON p.category_id = c.id " +
                    "WHERE o.status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') " +
                    "GROUP BY p.id, p.name, c.name " +
                    "ORDER BY revenue DESC LIMIT 5";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/top-categories")
    public ResponseEntity<?> getTopCategories() {
        try {
            String sql = "SELECT c.name, SUM(oi.quantity) as sold, SUM(oi.price * oi.quantity) as revenue " +
                    "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                    "JOIN products p ON oi.product_id = p.id " +
                    "JOIN categories c ON p.category_id = c.id " +
                    "WHERE o.status IN ('COMPLETED', 'Hoàn thành', 'Đã thanh toán', 'Thanh toán khi nhận hàng') " +
                    "GROUP BY c.name " +
                    "ORDER BY sold DESC LIMIT 5";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<?> getRecentOrders() {
        try {
            String sql = "SELECT id as order_id, full_name as customer_name, payable_amount as total_value, status, created_at " +
                    "FROM orders ORDER BY created_at DESC LIMIT 5";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/new-users")
    public ResponseEntity<?> getNewUsers() {
        try {
            String sql = "SELECT u.full_name, u.email, u.created_at " +
                    "FROM users u ORDER BY u.created_at DESC LIMIT 5";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/recent-reviews")
    public ResponseEntity<?> getRecentReviews() {
        try {
            String sql = "SELECT r.rating as stars, r.comment as content, u.full_name as customer_name, r.created_at " +
                    "FROM reviews r JOIN users u ON r.user_id = u.id " +
                    "ORDER BY r.created_at DESC LIMIT 5";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<?> getRecentActivities() {
        try {
            List<Map<String, Object>> activities = new ArrayList<>();
            
            List<Map<String, Object>> orders = jdbcTemplate.queryForList("SELECT id as order_id, full_name, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
            for (Map<String, Object> o : orders) {
                Map<String, Object> act = new HashMap<>();
                act.put("time", o.get("created_at"));
                act.put("content", "Khách " + o.get("full_name") + " đặt đơn #" + o.get("order_id"));
                act.put("type", "order");
                activities.add(act);
            }

            List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5");
            for (Map<String, Object> u : users) {
                Map<String, Object> act = new HashMap<>();
                act.put("time", u.get("created_at"));
                act.put("content", "Khách " + u.get("full_name") + " vừa đăng ký mới");
                act.put("type", "user");
                activities.add(act);
            }

            try {
                List<Map<String, Object>> reviews = jdbcTemplate.queryForList("SELECT u.full_name, r.rating, r.created_at FROM reviews r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT 5");
                for (Map<String, Object> r : reviews) {
                    Map<String, Object> act = new HashMap<>();
                    act.put("time", r.get("created_at"));
                    act.put("content", "Khách " + r.get("full_name") + " đánh giá " + r.get("rating") + "⭐");
                    act.put("type", "review");
                    activities.add(act);
                }
            } catch (Exception e) {} 

            activities.sort((a, b) -> {
                Object ta = a.get("time");
                Object tb = b.get("time");
                if (ta != null && tb != null) {
                    return tb.toString().compareTo(ta.toString()); // Simple string comparison for standard ISO formats
                }
                return 0;
            });

            return ResponseEntity.ok(activities.stream().limit(10).collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        try {
            List<Map<String, Object>> notifications = new ArrayList<>();
            
            String sqlPending = "SELECT COUNT(*) FROM orders WHERE status IN ('Chờ xác nhận', 'Chờ xử lý', 'PENDING')";
            Integer pendingOrders = jdbcTemplate.queryForObject(sqlPending, Integer.class);
            if (pendingOrders != null && pendingOrders > 0) {
                notifications.add(Map.of("message", "Có " + pendingOrders + " đơn hàng chờ xác nhận", "type", "warning"));
            }
            
            String sqlLowStock = "SELECT COUNT(*) FROM product_variants WHERE inventory <= 5";
            Integer lowStock = jdbcTemplate.queryForObject(sqlLowStock, Integer.class);
            if (lowStock != null && lowStock > 0) {
                notifications.add(Map.of("message", "Có " + lowStock + " sản phẩm sắp hết hàng", "type", "error"));
            }

            if (notifications.isEmpty()) {
                notifications.add(Map.of("message", "Hệ thống hoạt động ổn định", "type", "success"));
            }
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}