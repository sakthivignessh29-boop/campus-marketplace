package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Report generateReport(String title, ReportType type, User creator) {
        String fileUrl = "/api/reports/download/" + type.name().toLowerCase() + "_" + System.currentTimeMillis() + ".csv";

        Report report = Report.builder()
                .title(title)
                .type(type)
                .fileUrl(fileUrl)
                .createdBy(creator)
                .build();

        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public String generateCsvContent(ReportType type) {
        StringBuilder csv = new StringBuilder();
        switch (type) {
            case MONTHLY_SUSTAINABILITY -> {
                csv.append("Metric,Value\n");
                csv.append("Total Items Reused,").append(productRepository.findByStatus(ProductStatus.REUSED).size()).append("\n");
                csv.append("Total Active Listings,").append(productRepository.findByStatus(ProductStatus.AVAILABLE).size()).append("\n");
                csv.append("Completed Donations,").append(donationRepository.findByTrackingStatus(DonationStatus.DELIVERED).size()).append("\n");
                double co2 = productRepository.findByStatus(ProductStatus.REUSED).stream()
                        .mapToDouble(Product::getSustainabilityScore)
                        .sum();
                csv.append("Total CO2 Saved (kg),").append(co2).append("\n");
            }
            case MARKETPLACE -> {
                csv.append("Product ID,Name,Price,Condition,Category,Type,Status\n");
                List<Product> products = productRepository.findAll();
                for (Product p : products) {
                    csv.append(p.getId()).append(",")
                            .append(p.getName().replace(",", " ")).append(",")
                            .append(p.getPrice()).append(",")
                            .append(p.getItemCondition()).append(",")
                            .append(p.getCategory().getName()).append(",")
                            .append(p.getType().name()).append(",")
                            .append(p.getStatus().name()).append("\n");
                }
            }
            case DONATION -> {
                csv.append("Donation ID,Donor,Beneficiary,Status,CO2 Saved (kg),Waste Saved (kg)\n");
                List<Donation> donations = donationRepository.findAll();
                for (Donation d : donations) {
                    csv.append(d.getId()).append(",")
                            .append(d.getDonor().getName()).append(",")
                            .append(d.getBeneficiary() != null ? d.getBeneficiary().getName() : "None").append(",")
                            .append(d.getTrackingStatus().name()).append(",")
                            .append(d.getImpactCo2()).append(",")
                            .append(d.getImpactWaste()).append("\n");
                }
            }
            case USER_ACTIVITY -> {
                csv.append("User ID,Name,Email,Department,Role,EcoPoints,SustainabilityScore\n");
                List<User> users = userRepository.findAll();
                for (User u : users) {
                    csv.append(u.getId()).append(",")
                            .append(u.getName().replace(",", " ")).append(",")
                            .append(u.getEmail()).append(",")
                            .append(u.getDepartment() != null ? u.getDepartment() : "N/A").append(",")
                            .append(u.getRole().name()).append(",")
                            .append(u.getEcoPoints()).append(",")
                            .append(u.getSustainabilityScore()).append("\n");
                }
            }
        }
        return csv.toString();
    }
}
