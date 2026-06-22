package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getRecommendations(User user) {
        List<Product> available = productRepository.findByStatus(ProductStatus.AVAILABLE);
        List<Product> recommendations = new ArrayList<>();

        // 1. Department-based matching
        String userDept = user.getDepartment();
        if (userDept != null && !userDept.trim().isEmpty()) {
            List<Product> deptProducts = available.stream()
                    .filter(p -> p.getSeller() != null && 
                            userDept.equalsIgnoreCase(p.getSeller().getDepartment()) && 
                            !p.getSeller().getId().equals(user.getId()))
                    .toList();
            recommendations.addAll(deptProducts);
        }

        // 2. Default fallbacks
        if (recommendations.size() < 4) {
            List<Product> defaults = available.stream()
                    .filter(p -> !p.getSeller().getId().equals(user.getId()))
                    .limit(5)
                    .toList();
            recommendations.addAll(defaults);
        }

        // De-duplicate
        return recommendations.stream().distinct().limit(8).toList();
    }

    public List<Product> getTrendingListings() {
        return productRepository.findByStatus(ProductStatus.AVAILABLE).stream()
                .sorted((p1, p2) -> p2.getSustainabilityScore().compareTo(p1.getSustainabilityScore()))
                .limit(5)
                .toList();
    }
}
