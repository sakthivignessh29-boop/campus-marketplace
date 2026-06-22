package com.campus.marketplace.controller;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.GeminiService;
import com.campus.marketplace.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ReportService reportService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AdminLogRepository adminLogRepository;

    @GetMapping("/fraud-queue")
    public ResponseEntity<List<Product>> getFraudQueue() {
        return ResponseEntity.ok(productRepository.findByStatus(ProductStatus.PENDING));
    }

    @PostMapping("/approve/{productId}")
    public ResponseEntity<?> approveProduct(@PathVariable Long productId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findById(principal.getId()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        product.setStatus(ProductStatus.AVAILABLE);
        productRepository.save(product);

        adminLogRepository.save(AdminLog.builder()
                .admin(admin)
                .action("APPROVE_LISTING")
                .targetId(productId)
                .targetType("PRODUCT")
                .build());

        return ResponseEntity.ok("Product approved successfully!");
    }

    @PostMapping("/reject/{productId}")
    public ResponseEntity<?> rejectProduct(@PathVariable Long productId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findById(principal.getId()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);

        adminLogRepository.save(AdminLog.builder()
                .admin(admin)
                .action("REJECT_LISTING")
                .targetId(productId)
                .targetType("PRODUCT")
                .build());

        return ResponseEntity.ok("Product listing rejected/archived.");
    }

    @PostMapping("/reports/generate")
    public ResponseEntity<?> generateReport(@RequestParam String title, @RequestParam ReportType type) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User creator = userRepository.findById(principal.getId()).orElseThrow();

        Report report = reportService.generateReport(title, type, creator);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/reports/download/{id}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found!"));

        String csv = reportService.generateCsvContent(report.getType());
        byte[] csvBytes = csv.getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", report.getType().name().toLowerCase() + "_report.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getAiInsights() {
        long activeProducts = productRepository.findByStatus(ProductStatus.AVAILABLE).size();
        long reusedProducts = productRepository.findByStatus(ProductStatus.REUSED).size();
        long users = userRepository.count();

        String prompt = "Analyze these circular economy stats for NIT campus:\n" +
                "- Total users registered: " + users + "\n" +
                "- Total items recirculated/reused: " + reusedProducts + "\n" +
                "- Active listings currently available: " + activeProducts + "\n" +
                "Provide demand trends, recycle rates, and 2 key administrative recommendations. " +
                "Respond strictly with a JSON object containing demandTrends (array of {category, demandScore, circulationCycle}), co2ReductionTonnage, wasteAvoidedKg, and actionableRecommendations (array of strings).";

        String insights = geminiService.generateText(prompt);
        return ResponseEntity.ok(insights);
    }
}
