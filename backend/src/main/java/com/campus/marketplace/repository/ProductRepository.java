package com.campus.marketplace.repository;

import com.campus.marketplace.model.Product;
import com.campus.marketplace.model.ProductStatus;
import com.campus.marketplace.model.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(ProductStatus status);
    List<Product> findBySellerId(Long sellerId);
    List<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status);
    List<Product> findByTypeAndStatus(ProductType type, ProductStatus status);
}
