package com.handmade.handmade_api.modules.users.dto;

import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String username;
    private String fullName;
    private List<String> roles;
    @Builder.Default
    private List<ProductResponse> wishlist = new ArrayList<>();
    private Integer points;
    private String lastSpinDate;
}
