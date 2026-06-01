package com.handmade.handmade_api.modules.vnpay.config;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class VNPayConfig {

    /**
     * Hàm băm dữ liệu chuẩn HMAC SHA512 bảo mật để gửi sang VNPay
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
     * Hàm lấy chính xác địa chỉ IP của khách hàng (Client) khi thực hiện giao dịch
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
     * Hàm băm mật mã chuỗi MD5 (Nếu cần dùng cho các tác vụ phụ trợ mã hóa của VNPay)
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
}