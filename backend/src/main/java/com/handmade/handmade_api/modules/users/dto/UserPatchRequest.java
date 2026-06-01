package com.handmade.handmade_api.modules.users.dto;

import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import lombok.Data;

import java.util.List;

@Data
public class UserPatchRequest {
    private List<ProductResponse> wishlist;
    private Integer points;
    private String lastSpinDate;
}
