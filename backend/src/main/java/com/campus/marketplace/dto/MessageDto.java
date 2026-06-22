package com.campus.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageDto {
    @NotNull
    private Long receiverId;

    @NotBlank
    private String content;

    private Long productId;

    private String imageUrl;
}
