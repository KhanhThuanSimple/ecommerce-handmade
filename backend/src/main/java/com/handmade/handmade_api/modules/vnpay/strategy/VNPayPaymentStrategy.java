package com.handmade.handmade_api.modules.vnpay.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.handmade.handmade_api.modules.vnpay.config.VNPayConfig;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Component("VNPAY")
public class VNPayPaymentStrategy implements PaymentStrategy {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String createPaymentUrl(String orderId, BigDecimal amount, String configJson) {
        try {
            // 1. Giải mã cấu hình JSON từ DB
            Map<String, String> config = objectMapper.readValue(configJson, Map.class);

            String vnp_Url = config.get("vnp_Url");
            String vnp_TmnCode = config.get("vnp_TmnCode");
            String vnp_HashSecret = config.get("vnp_HashSecret");
            String vnp_ReturnUrl = config.get("vnp_ReturnUrl");

            // ✅ CẢI THIỆN: Lấy IP thực từ request
            String ipAddr = getClientIp();

            // 2. Thiết lập các tham số
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", orderId);
            
            // ✅ CẢI THIỆN: OrderInfo chi tiết hơn
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang " + orderId + " - Handmade Shop");
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            
            // ✅ CẢI THIỆN: Lấy IP động
            vnp_Params.put("vnp_IpAddr", ipAddr);

            // Thời gian tạo
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            // ✅ Thời gian hết hạn (15 phút)
            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // 3. Sắp xếp tham số theo bảng chữ cái
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();

            for (String fieldName : fieldNames) {
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());
                    
                    if (hashData.length() > 0) {
                        hashData.append('&');
                        query.append('&');
                    }
                    
                    hashData.append(fieldName).append('=').append(encodedValue);
                    query.append(fieldName).append('=').append(encodedValue);
                }
            }

            // 4. Tạo chữ ký
            String vnp_SecureHash = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());
            query.append("&vnp_SecureHash=").append(vnp_SecureHash);

            // 5. Trả về URL hoàn chỉnh
            return vnp_Url + "?" + query.toString();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo URL thanh toán VNPay: " + e.getMessage(), e);
        }
    }

    /**
     * ✅ Lấy IP thực của client
     */
    private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return VNPayConfig.getIpAddress(request);
            }
        } catch (Exception e) {
            // Fallback
        }
        return "127.0.0.1";
    }

    /**
     * ✅ Hàm hỗ trợ lấy thông báo lỗi từ mã phản hồi
     */
    public static String getResponseMessage(String responseCode) {
        Map<String, String> messages = new HashMap<>();
        messages.put("00", "Giao dịch thành công");
        messages.put("01", "Giao dịch đã tồn tại");
        messages.put("02", "Merchant không hợp lệ");
        messages.put("03", "Dữ liệu gửi sang không đúng định dạng");
        messages.put("04", "Không tìm thấy giao dịch");
        messages.put("05", "Số tiền không hợp lệ");
        messages.put("06", "Mã đơn hàng không hợp lệ");
        messages.put("07", "Chữ ký không hợp lệ");
        messages.put("08", "Thông tin thẻ không hợp lệ");
        messages.put("09", "Giao dịch đã bị hủy");
        messages.put("10", "Giao dịch đã được hoàn tiền");
        messages.put("11", "Giao dịch đã được thanh toán");
        messages.put("12", "Giao dịch đang được xử lý");
        messages.put("13", "Giao dịch thất bại");
        messages.put("14", "Giao dịch đã hết hạn");
        messages.put("15", "Giao dịch đã bị từ chối");
        messages.put("24", "Giao dịch không thành công");
        messages.put("99", "Lỗi hệ thống");
        return messages.getOrDefault(responseCode, "Mã lỗi không xác định: " + responseCode);
    }
}