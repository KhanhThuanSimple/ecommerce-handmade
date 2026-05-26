package com.handmade.handmade_api.modules.order.service;

import com.handmade.handmade_api.modules.cart.repository.CartItemRepository;
import com.handmade.handmade_api.modules.order.DTOs.OrderRequestDTO;
import com.handmade.handmade_api.modules.order.entity.Order;
import com.handmade.handmade_api.modules.order.entity.OrderItem;
import com.handmade.handmade_api.modules.order.repository.OrderRepository;
import com.handmade.handmade_api.modules.products.repository.ProductVariantRepository;
import com.handmade.handmade_api.modules.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final VoucherRepository voucherRepository;
    private final CartItemRepository cartItemRepository;

    /**
     * Luồng khởi tạo đơn hàng tổng quát (Áp dụng cho cả COD và VNPAY)
     * Đơn hàng vừa tạo lập tức kích hoạt trạng thái GIỮ HÀNG TẠM (reserveStock)
     */
    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(OrderRequestDTO dto) {
        log.info("Bắt đầu khởi tạo đơn hàng: {} cho User ID: {}", dto.getId(), dto.getUser_id());

        // 1. Tạo thực thể Đơn hàng chính
        Order order = Order.builder()
                .id(dto.getId())
                .userId(dto.getUser_id())
                .fullName(dto.getFull_name())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .totalAmount(dto.getTotal_amount())
                .discountAmount(dto.getDiscount_amount())
                .payableAmount(dto.getPayable_amount())
                .paymentMethod(dto.getPayment_method())
                .voucherCode(dto.getVoucher_code())
                .status(dto.getStatus())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // 2. Mapping danh sách các sản phẩm đặt mua
        List<OrderItem> items = dto.getItems().stream().map(i -> OrderItem.builder()
                .order(order)
                .productId(i.getProduct_id())
                .variantId(i.getVariant_id())
                .productName(i.getProduct_name())
                .price(i.getPrice())
                .quantity(i.getQuantity())
                .build()).collect(Collectors.toList());

        order.setItems(items);
        Order savedOrder = orderRepository.save(order);

        // 3. LUỒNG GIỮ HÀNG TẠM: Bất kể COD hay VNPAY đều phải giữ hàng trước để đảm bảo an toàn kho
        for (OrderItem item : savedOrder.getItems()) {
            log.info("Đang thực hiện giữ hàng tạm (Reserve): {} (Variant ID: {}), Số lượng: {}",
                    item.getProductName(), item.getVariantId(), item.getQuantity());

            int updatedRows = variantRepository.reserveStock(item.getProductId(), item.getVariantId(), item.getQuantity());

            if (updatedRows == 0) {
                log.error("LỖI KHO: Sản phẩm {} không đủ số lượng tồn khả dụng (Inventory - Reserved)!", item.getProductName());
                throw new RuntimeException("Sản phẩm " + item.getProductName() + " đã hết hàng hoặc không đủ tồn kho!");
            }
        }

        // 4. LUỒNG XỬ LÝ RIÊNG BIỆT CHO COD:
        // Đối với đơn COD, vì không qua cổng thanh toán trực tuyến, ta thực hiện trừ kho thật và xóa giỏ hàng luôn
        if ("COD".equalsIgnoreCase(dto.getPayment_method())) {
            log.info("Đơn hàng {} là COD, thực hiện xác nhận trừ kho và dọn dẹp giỏ hàng ngay lập tức.", savedOrder.getId());
            this.confirmStockAndCleanUp(savedOrder);
        }

        return savedOrder;
    }

    /**
     * Hàm nội bộ giải phóng hàng giữ tạm thành TRỪ KHO THẬT và làm sạch giỏ hàng/voucher.
     * Chạy ngay cho đơn COD khi tạo thành công, hoặc chạy khi VNPay Callback báo kết quả giao dịch hợp lệ.
     */
    public void confirmStockAndCleanUp(Order order) {
        for (OrderItem item : order.getItems()) {
            log.info("Xác nhận trừ kho thật (Confirm Reserved): {}, Variant ID: {}, Số lượng: {}",
                    item.getProductName(), item.getVariantId(), item.getQuantity());

            // Chuyển hàng từ trạng thái Giữ tạm sang Trừ kho thực tế dưới Database
            int updatedRows = variantRepository.confirmReservedStock(item.getProductId(), item.getVariantId(), item.getQuantity());

            if (updatedRows == 0) {
                log.error("LỖI ĐỒNG BỘ: Không thể xác nhận trừ kho cho sản phẩm {} (Variant ID: {})!",
                        item.getProductName(), item.getVariantId());
                throw new RuntimeException("Lỗi hệ thống khi xử lý đồng bộ kho hàng!");
            }

            // Dọn dẹp sản phẩm khỏi giỏ hàng hệ thống của User
            cartItemRepository.deleteUserCartItem(order.getUserId(), item.getProductId());
        }

        // Tăng số lượt sử dụng Voucher
        String appliedVoucher = order.getVoucherCode();
        if (appliedVoucher != null && !appliedVoucher.trim().isEmpty()) {
            log.info("Ghi nhận tăng lượt sử dụng cho mã Voucher: {}", appliedVoucher);
            int updatedVouchers = voucherRepository.incrementUsedCount(appliedVoucher);
            if (updatedVouchers == 0) {
                log.warn("CẢNH BÁO: Mã Voucher {} không thể cập nhật thành công!", appliedVoucher);
            }
        }
    }

    /**
     * Tiếp nhận phản hồi đối soát kết quả từ cổng thanh toán VNPAY
     */
    @Transactional(rollbackFor = Exception.class)
    public void handleVNPayCallback(Map<String, String> vnpParams) {
        String orderId = vnpParams.get("vnp_TxnRef");
        String responseCode = vnpParams.get("vnp_ResponseCode");
        String transactionNo = vnpParams.get("vnp_TransactionNo");

        log.info("Nhận callback đối soát từ VNPay cho đơn hàng: {}. Mã phản hồi: {}", orderId, responseCode);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng đối soát hệ thống: " + orderId));

        // Kiểm tra tính lặp (Idempotency Check)
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            log.info("Đơn hàng {} đã được xử lý trước đó với trạng thái: {}. Bỏ qua.", orderId, order.getStatus());
            return;
        }

        if ("00".equals(responseCode)) {
            // Trường hợp 1: Khách thanh toán VNPAY thành công
            order.setStatus("AWAITING_SHIPMENT");
            order.setVnpayTranNo(transactionNo);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Chuyển hóa lượng hàng giữ tạm thành trừ kho thật, dọn dẹp giỏ hàng
            this.confirmStockAndCleanUp(order);
            log.info("Đơn hàng VNPAY {} đã đối soát thành công và chính thức khấu trừ kho.", orderId);
        } else {
            // Trường hợp 2: Khách hủy giao dịch hoặc thanh toán lỗi tại cổng ngân hàng
            order.setStatus("CANCELLED");
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // HOÀN TRẢ KHO: Giải phóng lượng hàng đang bị khóa tạm (Reserved) về lại kho chung cho người khác mua
            for (OrderItem item : order.getItems()) {
                log.info("Giải phóng hàng giữ tạm (Release Reserved) do hủy đơn: {} (Variant ID: {})",
                        item.getProductName(), item.getVariantId());
                variantRepository.releaseReservedStock(item.getProductId(), item.getVariantId(), item.getQuantity());
            }
            log.warn("Đơn hàng VNPAY {} thanh toán thất bại, đã hoàn trả lại số lượng giữ tạm.", orderId);
        }
    }

    public List<Order> getOrderHistory(Long userId) {
        return orderRepository.findByUserIdOrderByIdDesc(userId);
    }

    public Order getOrderDetail(String id) {
        return orderRepository.findById(id).orElse(null);
    }
}