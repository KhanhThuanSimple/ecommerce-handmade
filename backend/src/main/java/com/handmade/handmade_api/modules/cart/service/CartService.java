package com.handmade.handmade_api.modules.cart.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.handmade.handmade_api.modules.cart.dto.CartItemDto;
import com.handmade.handmade_api.modules.cart.entity.Cart;
import com.handmade.handmade_api.modules.cart.entity.CartItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * LẤY GIỎ HÀNG TỪ DB (Tự động nạp thông tin sản phẩm thật)
     */
    public Optional<Cart> getCartByUserId(Long userId) {
        Cart cart = new Cart();
        cart.setId(userId);
        cart.setUserId(userId);
        cart.setItems(new ArrayList<>());

        try {
            String sql = "SELECT full_name FROM users WHERE id = ?";
            String cartJson = jdbcTemplate.queryForObject(sql, String.class, userId);

            if (cartJson != null && !cartJson.trim().isEmpty() && cartJson.startsWith("[")) {
                List<CartItem> items = objectMapper.readValue(cartJson, new TypeReference<List<CartItem>>() {});
                cart.setItems(items);
            }
        } catch (Exception e) {
            // Trả về giỏ trống nếu user chưa có giỏ hàng
        }

        // Đổ thông tin Live dữ liệu từ bảng products và product_images
        enrichCartItemsWithDbData(cart.getItems());
        return Optional.of(cart);
    }

    /**
     * LƯU GIỎ HÀNG XUỐNG DB USERS
     */
    public Cart saveCart(Long userId, List<CartItemDto> itemDtos) {
        List<CartItem> itemsToSave = convertToEntityList(itemDtos);
        
        try {
            // Chuyển mảng gọn nhẹ thành chuỗi JSON
            String cartJson = objectMapper.writeValueAsString(itemsToSave);

            // Ghi đè vào trường full_name của bảng users
            String updateSql = "UPDATE users SET full_name = ? WHERE id = ?";
            jdbcTemplate.update(updateSql, cartJson, userId);

        } catch (Exception e) {
            e.printStackTrace();
        }

        Cart cart = new Cart();
        cart.setId(userId);
        cart.setUserId(userId);
        cart.setItems(itemsToSave);
        
        // Đổ thông tin live để trả về phản hồi lập tức cho Frontend React render luôn
        enrichCartItemsWithDbData(cart.getItems());
        return cart;
    }

    public Cart updateCartItems(Long cartId, List<CartItemDto> itemDtos) {
        return saveCart(cartId, itemDtos);
    }

    /**
     * XÓA GIỎ HÀNG KHI ĐẶT HÀNG THÀNH CÔNG
     */
    public void clearCartInDb(Long userId) {
        try {
            String updateSql = "UPDATE users SET full_name = NULL WHERE id = ?";
            jdbcTemplate.update(updateSql, userId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private List<CartItem> convertToEntityList(List<CartItemDto> dtos) {
        List<CartItem> items = new ArrayList<>();
        if (dtos != null) {
            long fakeId = 1L;
            for (CartItemDto dto : dtos) {
                CartItem item = new CartItem();
                item.setId(fakeId++);
                item.setProductId(dto.getProductId());
                item.setQuantity(dto.getQuantity());
                // Không set các trường productName, price, imageUrl -> Jackson sẽ tự bỏ qua khi sinh JSON
                items.add(item);
            }
        }
        return items;
    }

    /**
     * NẠP LIVE DATA: Lấy dữ liệu tên, giá, ảnh từ bảng sản phẩm gốc của bạn
     */
    private void enrichCartItemsWithDbData(List<CartItem> items) {
        if (items == null || items.isEmpty()) return;

        for (CartItem item : items) {
            try {
                // 1. Lấy tên và giá từ bảng products mẫu của bạn
                String productSql = "SELECT name, base_price FROM products WHERE id = ?";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(productSql, item.getProductId());
                
                if (!rows.isEmpty()) {
                    Map<String, Object> productData = rows.get(0);
                    item.setProductName((String) productData.get("name"));
                    item.setPrice(((java.math.BigDecimal) productData.get("base_price")).doubleValue());
                } else {
                    item.setProductName("Sản phẩm không tồn tại");
                    item.setPrice(0.0);
                }

                // 2. Lấy link ảnh nổi bật từ bảng product_images mẫu của bạn
                String imageSql = "SELECT image_url FROM product_images WHERE product_id = ? AND is_featured = TRUE LIMIT 1";
                List<String> images = jdbcTemplate.queryForList(imageSql, String.class, item.getProductId());
                
                if (!images.isEmpty()) {
                    item.setImageUrl(images.get(0));
                } else {
                    item.setImageUrl("https://via.placeholder.com/150");
                }

            } catch (Exception e) {
                item.setProductName("Lỗi nạp dữ liệu");
                item.setPrice(0.0);
            }
        }
    }
}