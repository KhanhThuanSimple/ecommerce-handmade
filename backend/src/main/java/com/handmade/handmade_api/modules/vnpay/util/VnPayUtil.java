package com.handmade.handmade_api.modules.vnpay.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public final class VnPayUtil {

    private VnPayUtil() {
    }

    public static String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue == null || fieldValue.isEmpty()) {
                continue;
            }
            if (!first) {
                hashData.append('&');
            }
            hashData.append(fieldName);
            hashData.append('=');
            hashData.append(encodeValue(fieldValue));
            first = false;
        }
        return hashData.toString();
    }

    public static String hmacSha512(String secretKey, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * raw.length);
            for (byte b : raw) {
                hex.append(String.format("%02x", b & 0xff));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPay", ex);
        }
    }

    public static String buildPaymentUrl(String baseUrl, Map<String, String> params, String secureHash) {
        String hashData = buildHashData(params);
        return baseUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    public static String encodeValue(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII).replace("+", "%20");
    }

    public static boolean verifySecureHash(Map<String, String> params, String receivedHash, String secretKey) {
        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }
        String hashData = buildHashData(params);
        String calculated = hmacSha512(secretKey, hashData);
        return calculated.equalsIgnoreCase(receivedHash.trim());
    }
}
