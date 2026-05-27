package com.handmade.handmade_api.modules.cart.service;

import com.handmade.handmade_api.modules.cart.dto.CartAddRequest;
import com.handmade.handmade_api.modules.cart.dto.CartItemProjection;
import com.handmade.handmade_api.modules.cart.dto.CartItemUpdateRequest; // Thêm import mới
import com.handmade.handmade_api.modules.cart.dto.CartMergeRequest;
import com.handmade.handmade_api.modules.cart.entity.Cart;
import com.handmade.handmade_api.modules.cart.entity.CartItem;
import com.handmade.handmade_api.modules.cart.repository.CartItemRepository;
import com.handmade.handmade_api.modules.cart.repository.CartRepository;
import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import com.handmade.handmade_api.modules.products.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map; // Thêm import mới
import java.util.Optional;
import java.util.stream.Collectors; // Thêm import mới

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, ProductService productService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productService = productService;
    }

    // LUỒNG 1: ĐỌC CHI TIẾT GIỎ HÀNG QUA PROJECTION
    public List<CartItemProjection> getCartByUserId(Long userId) {
        getOrCreateCart(userId); // Đảm bảo luôn tồn tại giỏ hàng cho User
        return cartItemRepository.findCartDetailsByUserId(userId);
    }

    // LUỒNG 2: THÊM HOẶC CẬP NHẬT SỐ LƯỢNG MÓN HÀNG
    @Transactional
    public void addToCart(CartAddRequest request) {
        ProductResponse product = productService.getProductById(request.getProductId());
        Cart cart = getOrCreateCart(request.getUserId());
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + request.getQuantity();

            if (newQuantity > product.getInventory()) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Cửa hàng chỉ còn tối đa " + product.getInventory() + " sản phẩm!");
            }
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            if (request.getQuantity() > product.getInventory()) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Số lượng đặt hàng vượt quá tồn kho hiện tại!");
            }
            CartItem newItem = CartItem.builder()
                    .cartId(cart.getId())
                    .productId(product.getId())
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
        }
    }

    // LUỒNG 3: GỘP GIỎ HÀNG TỪ LOCALSTORAGE KHI USER LOG IN
    @Transactional
    public void mergeCart(CartMergeRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) return;
        Cart cart = getOrCreateCart(request.getUserId());

        for (CartMergeRequest.ItemMerge guestItem : request.getItems()) {
            try {
                ProductResponse product = productService.getProductById(guestItem.getProductId());
                Optional<CartItem> userItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

                if (userItemOpt.isPresent()) {
                    CartItem userItem = userItemOpt.get();
                    int mergedQty = userItem.getQuantity() + guestItem.getQuantity();
                    userItem.setQuantity(Math.min(mergedQty, product.getInventory()));
                    cartItemRepository.save(userItem);
                } else {
                    CartItem newItem = CartItem.builder()
                            .cartId(cart.getId())
                            .productId(product.getId())
                            .quantity(Math.min(guestItem.getQuantity(), product.getInventory()))
                            .build();
                    cartItemRepository.save(newItem);
                }
            } catch (Exception e) {
                System.err.println("Bỏ qua gộp sản phẩm lỗi: " + guestItem.getProductId());
            }
        }
    }

    // LUỒNG 4: XÓA MÓN HÀNG
    @Transactional
    public void removeFromCart(Long userId, Long productId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng của bạn!"));
        cartItemRepository.deleteByCartIdAndProductId(cart.getId(), productId);
    }

    // LUỒNG GIẢM/TRỪ BỚT SỐ LƯỢNG KHI MUA HÀNG THÀNH CÔNG
    @Transactional
    public void deductOrderedItems(Long userId, Map<Long, Integer> orderedQuantities) {
        if (orderedQuantities == null || orderedQuantities.isEmpty()) return;
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null) return;

        for (Map.Entry<Long, Integer> entry : orderedQuantities.entrySet()) {
            Long productId = entry.getKey();
            int quantity = entry.getValue() == null ? 0 : entry.getValue();
            if (quantity <= 0) continue;

            cartItemRepository.findByCartIdAndProductId(cart.getId(), productId).ifPresent(item -> {
                int remaining = item.getQuantity() - quantity;
                if (remaining <= 0) {
                    cartItemRepository.delete(item);
                } else {
                    item.setQuantity(remaining);
                    cartItemRepository.save(item);
                }
            });
        }
    }

    // LUỒNG 5: CẬP NHẬT DANH SÁCH SẢN PHẨM TRONG GIỎ (Gọi từ Controller @PatchMapping)
    @Transactional
    public void updateCartItems(Long cartId, List<CartItemUpdateRequest> items) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng: " + cartId));

        List<CartItem> existingItems = cartItemRepository.findByCartId(cart.getId());
        Map<Long, CartItem> existingByProduct = existingItems.stream()
                .collect(Collectors.toMap(CartItem::getProductId, item -> item));

        for (CartItemUpdateRequest itemRequest : items) {
            ProductResponse product = productService.getProductById(itemRequest.getProductId());
            if (itemRequest.getQuantity() < 0 || itemRequest.getQuantity() > product.getInventory()) {
                throw new RuntimeException("Số lượng sản phẩm không hợp lệ cho sản phẩm " + product.getName());
            }

            if (itemRequest.getQuantity() == 0) {
                cartItemRepository.deleteByCartIdAndProductId(cart.getId(), itemRequest.getProductId());
                existingByProduct.remove(itemRequest.getProductId());
                continue;
            }

            CartItem item = existingByProduct.get(itemRequest.getProductId());
            if (item != null) {
                item.setQuantity(itemRequest.getQuantity());
                cartItemRepository.save(item);
            } else {
                CartItem newItem = CartItem.builder()
                        .cartId(cart.getId())
                        .productId(product.getId())
                        .quantity(itemRequest.getQuantity())
                        .build();
                cartItemRepository.save(newItem);
            }
            existingByProduct.remove(itemRequest.getProductId());
        }

        // Nếu có sản phẩm cũ không xuất hiện trong payload request gửi lên -> Xóa hẳn khỏi giỏ
        existingByProduct.values().forEach(cartItemRepository::delete);
    }

    // Helper tạo giỏ tự động nếu chưa có
    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));
    }
}