package com.handmade.handmade_api.modules.vnpay.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "vnpay")
public class VnPayProperties {

    /** Mã website (Terminal ID) từ VNPay */
    private String tmnCode = "3YVU8UO5";

    /** Chuỗi bí mật HMAC SHA512 */
    private String hashSecret = "DPY40HQ9Q8BA7GUMGZKCKYY7I9V3STA8";

    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /** URL FE nhận redirect sau thanh toán */
    private String returnUrl = "http://localhost:3000/vnpay-return";

    /** URL IPN (VNPay gọi server-to-server) */
    private String ipnUrl = "http://localhost:8080/api/vnpay/ipn";

    private String version = "2.1.0";
}
