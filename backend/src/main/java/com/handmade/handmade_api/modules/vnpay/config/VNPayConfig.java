package com.handmade.handmade_api.modules.vnpay.config;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class VNPayConfig {

    /**
     * HMAC SHA512
     */
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException("Key hoặc Data để băm SHA512 không được để trống");
            }
            final Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
            final SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512_HMAC.init(secret_key);
            byte[] bytes = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    /**
     * Lấy IP
     */
    public static String getIpAddress(HttpServletRequest request) {
        String ipAdress;
        try {
            ipAdress = request.getHeader("X-FORWARDED-FOR");
            if (ipAdress == null) {
                ipAdress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            ipAdress = "127.0.0.1";
        }
        return ipAdress;
    }

    /**
     * MD5
     */
    public static String Md5(String message) {
        String digest = null;
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                sb.append(String.format("%02x", b & 0xff));
            }
            digest = sb.toString();
        } catch (Exception ex) {
            digest = "";
        }
        return digest;
    }

    // =========================================================
    // ✅ THÊM MỚI: HÀM TẠO URL THANH TOÁN VNPAY
    // =========================================================

    /**
     * Tạo URL thanh toán VNPay với thời gian hết hạn (Expire Date)
     * @param params Map chứa các tham số VNPay
     * @param hashSecret Mã bí mật của merchant
     * @return URL thanh toán hoàn chỉnh
     * @throws Exception
     */
    public static String createPaymentUrl(Map<String, String> params, String hashSecret) throws Exception {
        // ✅ THÊM: Tính thời gian hết hạn (15 phút)
        long expireTime = System.currentTimeMillis() + (15 * 60 * 1000);
        String vnp_ExpireDate = new SimpleDateFormat("yyyyMMddHHmmss")
            .format(new Date(expireTime));
        params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Sắp xếp tham số theo thứ tự bảng chữ cái
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Không mã hóa vnp_Url
                if (fieldName.equals("vnp_Url")) {
                    continue;
                }
                
                String encodedValue = java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());
                
                if (hashData.length() > 0) {
                    hashData.append('&');
                    query.append('&');
                }
                
                hashData.append(fieldName).append('=').append(encodedValue);
                query.append(fieldName).append('=').append(encodedValue);
            }
        }

        // Tạo chữ ký
        String vnp_SecureHash = hmacSHA512(hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        query.append("&vnp_SecureHashType=SHA512");

        // Lấy URL gốc và thêm query string
        String baseUrl = params.get("vnp_Url");
        return baseUrl + "?" + query.toString();
    }

    /**
     * Kiểm tra chữ ký callback từ VNPay
     * @param fields Map tham số từ VNPay (đã loại bỏ vnp_SecureHash và vnp_SecureHashType)
     * @param hashSecret Mã bí mật của merchant
     * @param vnp_SecureHash Chữ ký từ VNPay gửi sang
     * @return true nếu chữ ký hợp lệ
     * @throws Exception
     */
    public static boolean verifySignature(Map<String, String> fields, String hashSecret, String vnp_SecureHash) throws Exception {
        // Sắp xếp tham số theo thứ tự bảng chữ cái
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (hashData.length() > 0) {
                    hashData.append('&');
                }
                String encodedValue = java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());
                hashData.append(fieldName).append('=').append(encodedValue);
            }
        }

        String signValue = hmacSHA512(hashSecret, hashData.toString());
        return signValue.equalsIgnoreCase(vnp_SecureHash);
    }

    /**
     * Lấy mã phản hồi giao dịch
     * @param responseCode Mã phản hồi từ VNPay
     * @return Thông báo tương ứng
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