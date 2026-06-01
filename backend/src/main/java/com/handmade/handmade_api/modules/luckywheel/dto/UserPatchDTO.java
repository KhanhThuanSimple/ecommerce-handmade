package com.handmade.handmade_api.modules.luckywheel.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserPatchDTO {
    @JsonProperty("lastSpinDate") 
    private String lastSpinDate;

    @JsonProperty("points")
    private Integer points;
}