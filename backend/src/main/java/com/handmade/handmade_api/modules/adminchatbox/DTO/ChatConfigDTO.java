package com.handmade.handmade_api.modules.adminchatbox.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConfigDTO {

    @NotBlank(message = "Config key is required")
    @Size(max = 100, message = "Config key max 100 characters")
    private String configKey;

    @NotBlank(message = "Config value is required")
    private String configValue;

    private String description;
}