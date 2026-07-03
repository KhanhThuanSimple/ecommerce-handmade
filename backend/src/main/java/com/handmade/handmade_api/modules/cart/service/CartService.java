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
        if (request.getQuantity() == null || request.getQuantity() == 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Số lượng không hợp lệ");
        }

        ProductResponse product = productService.getProductById(request.getProductId());
        Cart cart = getOrCreateCart(request.getUserId());
        List<CartItem> existingItems = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (request.getQuantity() < 0) {
            decreaseCartQuantity(cart, product, existingItems, Math.abs(request.getQuantity()));
            return;
        }

        if (!existingItems.isEmpty()) {
            CartItem mainItem = existingItems.get(0);
            int totalExistingQty = existingItems.stream().mapToInt(CartItem::getQuantity).sum();
            int newQuantity = totalExistingQty + request.getQuantity();

            if (newQuantity > product.getInventory()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Cửa hàng chỉ còn tối đa " + product.getInventory() + " sản phẩm!");
            }
            mainItem.setQuantity(newQuantity);
            cartItemRepository.save(mainItem);

            // Xóa sạch các phần tử trùng lặp khác nếu có
            if (existingItems.size() > 1) {
                for (int i = 1; i < existingItems.size(); i++) {
                    cartItemRepository.delete(existingItems.get(i));
                }
            }
        } else {
            if (request.getQuantity() > product.getInventory()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Số lượng đặt hàng vượt quá tồn kho hiện tại!");
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
                List<CartItem> userItems = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

                if (!userItems.isEmpty()) {
                    CartItem mainItem = userItems.get(0);
                    int totalQty = userItems.stream().mapToInt(CartItem::getQuantity).sum() + guestItem.getQuantity();
                    mainItem.setQuantity(Math.min(totalQty, product.getInventory()));
                    cartItemRepository.save(mainItem);

                    // Xóa các dòng trùng lặp khác
                    if (userItems.size() > 1) {
                        for (int i = 1; i < userItems.size(); i++) {
                            cartItemRepository.delete(userItems.get(i));
                        }
                    }
                } else {
                    CartItem newItem = CartItem.builder()
                            .cartId(cart.getId())
                            .productId(product.getId())
                            .quantity(Math.min(guestItem.getQuantity(), product.getInventory()))
                            .build();
                    cartItemRepository.save(newItem);
                    cartItemRepository.flush(); // Bắt buộc flush để vòng lặp sau tìm kiếm thấy
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

            List<CartItem> items = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);
            if (!items.isEmpty()) {
                int totalExistingQty = items.stream().mapToInt(CartItem::getQuantity).sum();
                int remaining = totalExistingQty - quantity;
                if (remaining <= 0) {
                    cartItemRepository.deleteAll(items);
                } else {
                    CartItem mainItem = items.get(0);
                    mainItem.setQuantity(remaining);
                    cartItemRepository.save(mainItem);
                    if (items.size() > 1) {
                        for (int i = 1; i < items.size(); i++) {
                            cartItemRepository.delete(items.get(i));
                        }
                    }
                }
            }
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

    private void decreaseCartQuantity(Cart cart, ProductResponse product, List<CartItem> existingItems, int decreaseBy) {
        if (existingItems.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Sản phẩm không có trong giỏ hàng");
        }

        CartItem mainItem = existingItems.get(0);
        int totalExistingQty = existingItems.stream().mapToInt(CartItem::getQuantity).sum();
        int newQuantity = totalExistingQty - decreaseBy;

        if (newQuantity <= 0) {
            cartItemRepository.deleteAll(existingItems);
            return;
        }

        mainItem.setQuantity(newQuantity);
        cartItemRepository.save(mainItem);

        // Xóa sạch các phần tử trùng lặp khác nếu có
        if (existingItems.size() > 1) {
            for (int i = 1; i < existingItems.size(); i++) {
                cartItemRepository.delete(existingItems.get(i));
            }
        }
    }

    // Helper tạo giỏ tự động nếu chưa có
    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));
    }
}