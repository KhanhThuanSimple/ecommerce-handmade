package com.handmade.handmade_api.modules.vnpay.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.handmade.handmade_api.modules.vnpay.config.VNPayConfig; // Import lớp cấu hình tiện ích của bạn
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Component("VNPAY") // Định danh Bean bằng chữ hoa để khớp với Enum/Database phục vụ Strategy Pattern
public class VNPayPaymentStrategy implements PaymentStrategy {

    @Override
    public String createPaymentUrl(String orderId, BigDecimal amount, String configJson) {
        try {
            // 1. Giải mã cấu hình JSON từ DB của Admin thành Map
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> config = mapper.readValue(configJson, Map.class);

            String vnp_Url = config.get("vnp_Url");
            String vnp_TmnCode = config.get("vnp_TmnCode");
            String vnp_HashSecret = config.get("vnp_HashSecret");
            String vnp_ReturnUrl = config.get("vnp_ReturnUrl"); // Link FE hứng kết quả thanh toán

            // 2. Thiết lập các tham số cơ bản theo tài liệu VNPay
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            // VNPay yêu cầu số tiền nhân với 100 (Ví dụ: 10,000đ thành 1000000)
            vnp_Params.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", orderId);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang: " + orderId);
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", "127.0.0.1"); // Sau này có HttpServletRequest thì truyền động qua VNPayConfig.getIpAddress(request)

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // 3. Sắp xếp các tham số theo bảng chữ cái (Bắt buộc đối với VNPay)
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Xây dựng chuỗi dữ liệu băm
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    // Xây dựng chuỗi Query string gửi đi
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                            .append('=')
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }

            // 4. Gọi trực tiếp hàm mã hóa từ lớp VNPayConfig dùng chung
            String queryUrl = query.toString();
            String vnp_SecureHash = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

            return vnp_Url + "?" + queryUrl;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi cấu trúc hoặc băm mã checksum VNPay: " + e.getMessage());
        }
    }
}