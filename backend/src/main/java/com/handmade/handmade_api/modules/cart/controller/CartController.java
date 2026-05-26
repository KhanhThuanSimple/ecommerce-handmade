package com.handmade.handmade_api.modules.cart.controller;

import com.handmade.handmade_api.modules.cart.dto.CartAddRequest;
import com.handmade.handmade_api.modules.cart.dto.CartItemProjection;
import com.handmade.handmade_api.modules.cart.dto.CartMergeRequest;
import com.handmade.handmade_api.modules.cart.dto.CartUpdateRequest;
import com.handmade.handmade_api.modules.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<List<CartItemProjection>> getCart(@RequestParam(required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItemProjection>> getCartByPath(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<String> addToCart(@Valid @RequestBody CartAddRequest request) {
        cartService.addToCart(request);
        return ResponseEntity.ok("Đã cập nhật giỏ hàng thành công!");
    }

    @PostMapping("/merge")
    public ResponseEntity<String> mergeCart(@Valid @RequestBody CartMergeRequest request) {
        cartService.mergeCart(request);
        return ResponseEntity.ok("Đã đồng bộ hóa giỏ hàng vãng lai thành công!");
    }

    @DeleteMapping("/remove")
    public ResponseEntity<String> removeFromCart(@RequestParam Long userId, @RequestParam Long productId) {
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.ok("Đã xóa sản phẩm khỏi giỏ hàng.");
    }

    @PatchMapping("/{cartId}")
    public ResponseEntity<String> updateCart(@PathVariable Long cartId, @Valid @RequestBody CartUpdateRequest request) {
        cartService.updateCartItems(cartId, request.getItems());
        return ResponseEntity.ok("Đã cập nhật giỏ hàng thành công.");
    }
}