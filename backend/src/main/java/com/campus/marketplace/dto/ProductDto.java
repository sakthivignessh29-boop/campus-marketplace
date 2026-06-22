package com.campus.marketplace.dto;

import com.campus.marketplace.model.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductDto {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Double price;

    @NotBlank
    private String itemCondition;

    @NotNull
    private Long categoryId;

    @NotNull
    private ProductType type;

    private String imageUrl;

    private Double latitude;
    private Double longitude;
    private String pickupLocationName;
}
