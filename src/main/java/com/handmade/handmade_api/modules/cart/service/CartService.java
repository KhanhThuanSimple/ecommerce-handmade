package com.handmade.handmade_api.modules.cart.service;

import com.handmade.handmade_api.modules.cart.dto.CartAddRequest;
import com.handmade.handmade_api.modules.cart.dto.CartItemProjection;
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
import java.util.Optional;

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

    // LUỒNG 1: ĐỌC CHI TIẾT GIỎ HÀNG
    public List<CartItemProjection> getCartByUserId(Long userId) {
        // PHÒNG VỆ: Trả về danh sách trống ngay nếu khách vãng lai truyền id null/0/âm lên
        if (userId == null || userId <= 0) {
            return List.of();
        }
        getOrCreateCart(userId);
        return cartItemRepository.findCartDetailsByUserId(userId);
    }

    // LUỒNG 2: THÊM HOẶC CẬP NHẬT SỐ LƯỢNG
    @Transactional
    public void addToCart(CartAddRequest request) {
        ProductResponse product = productService.getProductById(request.getProductId());
        Cart cart = getOrCreateCart(request.getUserId());
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + request.getQuantity();

            if (newQuantity <= 0) {
                cartItemRepository.delete(item);
                return;
            }

            if (newQuantity > product.getInventory()) {
                throw new RuntimeException("Cửa hàng chỉ còn tối đa " + product.getInventory() + " sản phẩm!");
            }
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            if (request.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng đặt hàng không hợp lệ!");
            }
            if (request.getQuantity() > product.getInventory()) {
                throw new RuntimeException("Số lượng đặt hàng vượt quá tồn kho hiện tại!");
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

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));
    }
}