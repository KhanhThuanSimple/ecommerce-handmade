package com.handmade.handmade_api.modules.cart.controller;

import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.cart.dto.CartRequest;
import com.handmade.handmade_api.modules.cart.entity.Cart;
import com.handmade.handmade_api.modules.cart.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/carts")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<List<Cart>> getCartByUserId(
            @RequestParam(value = "userId", required = false) String userIdStr,
            @AuthenticationPrincipal User currentUser) {
        
        List<Cart> responseList = new ArrayList<>();

        try {
            if (currentUser != null && currentUser.getId() != null) {
                cartService.getCartByUserId(currentUser.getId()).ifPresent(responseList::add);
                return ResponseEntity.ok(responseList);
            }
            
            if (userIdStr == null || userIdStr.trim().isEmpty() || "null".equalsIgnoreCase(userIdStr.trim())) {
                return ResponseEntity.ok(responseList); 
            }

            Long userId = Long.parseLong(userIdStr.trim());
            cartService.getCartByUserId(userId).ifPresent(responseList::add);
            
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        return ResponseEntity.ok(responseList);
    }

    @PostMapping
    public ResponseEntity<?> createCart(
            @RequestBody CartRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        Long userId = (currentUser != null) ? currentUser.getId() : request.getUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().body("Không tìm thấy thông tin User hợp lệ!");
        }
        
        Cart newCart = cartService.saveCart(userId, request.getItems());
        return ResponseEntity.status(HttpStatus.CREATED).body(newCart);
    }

    @PatchMapping("/{cartId}")
    public ResponseEntity<?> updateCartItems(@PathVariable Long cartId, @RequestBody CartRequest request) {
        Cart updatedCart = cartService.updateCartItems(cartId, request.getItems());
        if (updatedCart == null) {
            return ResponseEntity.ok(new Cart());
        }
        return ResponseEntity.ok(updatedCart);
    }
}