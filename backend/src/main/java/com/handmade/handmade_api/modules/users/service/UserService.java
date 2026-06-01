package com.handmade.handmade_api.modules.users.service;

import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import com.handmade.handmade_api.modules.luckywheel.service.LuckyWheelService;
import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import com.handmade.handmade_api.modules.products.service.ProductService;
import com.handmade.handmade_api.modules.users.dto.UserPatchRequest;
import com.handmade.handmade_api.modules.users.dto.UserProfileResponse;
import com.handmade.handmade_api.modules.users.entity.UserWishlistItem;
import com.handmade.handmade_api.modules.users.repository.UserWishlistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProductService productService;
    private final UserWishlistRepository userWishlistRepository;
    private final LuckyWheelService luckyWheelService; // 💡 Inject service vòng quay vào đây

    public UserService(UserRepository userRepository,
                       ProductService productService,
                       UserWishlistRepository userWishlistRepository,
                       LuckyWheelService luckyWheelService) {
        this.userRepository = userRepository;
        this.productService = productService;
        this.userWishlistRepository = userWishlistRepository;
        this.luckyWheelService = luckyWheelService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        return toProfile(user);
    }

    @Transactional
    public UserProfileResponse patchProfile(Long userId, UserPatchRequest request) {
        User user = findUser(userId);

        // 1. Lưu danh sách yêu thích Wishlist
        if (request.getWishlist() != null) {
            List<Long> productIds = request.getWishlist().stream()
                    .map(ProductResponse::getId)
                    .filter(id -> id != null)
                    .distinct()
                    .collect(Collectors.toList());
            try {
                userWishlistRepository.deleteAllByUserId(userId);
                List<UserWishlistItem> items = productIds.stream()
                        .map(pid -> new UserWishlistItem(userId, pid, LocalDateTime.now()))
                        .collect(Collectors.toList());
                userWishlistRepository.saveAll(items);
            } catch (Exception ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lỗi cập nhật danh sách yêu thích.", ex);
            }
        }

        // 2 & 3. Ủy thác gọi sang LuckyWheelService xử lý điểm số và ngày quay
        luckyWheelService.updateSpinProfile(user, request.getPoints(), request.getLastSpinDate());

        return toProfile(user);
    }

    public List<ProductResponse> resolveWishlistProducts(Long userId) {
        List<Long> ids;
        try { ids = userWishlistRepository.findProductIdsByUserId(userId); } 
        catch (Exception ex) { ids = List.of(); }
        
        List<ProductResponse> products = new ArrayList<>();
        for (Long productId : ids) {
            try { products.add(productService.getProductById(productId)); } 
            catch (Exception ignored) {}
        }
        return products;
    }

    private UserProfileResponse toProfile(User user) {
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Đọc trực tiếp mối quan hệ đã map an toàn
        UserSpinProfile profile = user.getSpinProfile();

        Integer points = (profile != null && profile.getPoints() != null) ? profile.getPoints() : 0;
        LocalDateTime lastSpin = (profile != null && profile.getLastSpinDate() != null) ? profile.getLastSpinDate() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .roles(roles)
                .wishlist(resolveWishlistProducts(user.getId()))
                .points(points)
                .lastSpinDate(lastSpin != null ? lastSpin.toString() : null)
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }
}