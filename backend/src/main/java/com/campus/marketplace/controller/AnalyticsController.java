package com.campus.marketplace.controller;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import com.campus.marketplace.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/impact")
    public ResponseEntity<?> getGlobalImpact() {
        List<Product> reusedProducts = productRepository.findByStatus(ProductStatus.REUSED);
        int totalReused = reusedProducts.size();

        // Calculate CO2 saved (Product sustainabilityScore as CO2 saved in kg)
        double co2Saved = reusedProducts.stream()
                .mapToDouble(Product::getSustainabilityScore)
                .sum();

        // Calculate waste reduced (Donations completed * 5kg average)
        List<Donation> completedDonations = donationRepository.findByTrackingStatus(DonationStatus.DELIVERED);
        double wasteReduced = completedDonations.stream()
                .mapToDouble(d -> d.getImpactWaste() != null ? d.getImpactWaste() : 2.0)
                .sum() + (totalReused * 1.5); // Add general reuse saving estimation

        // Total savings estimation (totalReused * average price of 300 INR)
        double totalSavings = reusedProducts.stream()
                .mapToDouble(Product::getPrice)
                .sum() * 0.5; // Average saving rate: 50%

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalReused", totalReused);
        metrics.put("co2SavedKg", co2Saved);
        metrics.put("wasteReducedKg", wasteReduced);
        metrics.put("completedDonations", completedDonations.size());
        metrics.put("studentSavingsINR", totalSavings);

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartmentComparison() {
        List<User> users = userRepository.findAll();
        List<Product> reused = productRepository.findByStatus(ProductStatus.REUSED);

        Map<String, Long> userCountByDept = users.stream()
                .filter(u -> u.getDepartment() != null)
                .collect(Collectors.groupingBy(User::getDepartment, Collectors.counting()));

        Map<String, Integer> reuseCountByDept = new HashMap<>();
        for (Product p : reused) {
            if (p.getSeller() != null && p.getSeller().getDepartment() != null) {
                String dept = p.getSeller().getDepartment();
                reuseCountByDept.put(dept, reuseCountByDept.getOrDefault(dept, 0) + 1);
            }
        }

        List<Map<String, Object>> comparison = new ArrayList<>();
        userCountByDept.forEach((dept, count) -> {
            Map<String, Object> deptData = new HashMap<>();
            deptData.put("department", dept);
            deptData.put("studentCount", count);
            deptData.put("reusedItemsCount", reuseCountByDept.getOrDefault(dept, 0));
            comparison.add(deptData);
        });

        return ResponseEntity.ok(comparison);
    }
}
