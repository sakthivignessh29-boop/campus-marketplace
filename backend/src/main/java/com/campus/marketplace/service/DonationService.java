package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.DonationRepository;
import com.campus.marketplace.repository.ProductRepository;
import com.campus.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class DonationService {

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Donation initiateDonation(Product product, User donor) {
        double co2 = 0.0;
        double waste = 0.0;

        String category = product.getCategory().getName().toLowerCase();
        if (category.contains("textbook") || category.contains("stationery")) {
            co2 = 2.5;
            waste = 1.2;
        } else if (category.contains("electronic")) {
            co2 = 15.0;
            waste = 3.5;
        } else if (category.contains("furniture")) {
            co2 = 40.0;
            waste = 25.0;
        } else if (category.contains("lab")) {
            co2 = 12.0;
            waste = 4.0;
        } else {
            co2 = 5.0;
            waste = 2.0;
        }

        Donation donation = Donation.builder()
                .product(product)
                .donor(donor)
                .trackingStatus(DonationStatus.SUBMITTED)
                .impactCo2(co2)
                .impactWaste(waste)
                .build();

        product.setStatus(ProductStatus.PENDING);
        productRepository.save(product);

        return donationRepository.save(donation);
    }

    @Transactional
    public Donation matchBeneficiary(Long donationId, User beneficiary) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("Donation record not found!"));

        donation.setBeneficiary(beneficiary);
        donation.setTrackingStatus(DonationStatus.MATCHED);

        notificationService.createNotification(
                donation.getDonor(),
                "Good news! A beneficiary is matched for your donation: " + donation.getProduct().getName(),
                NotificationType.DONATION_ACCEPTED
        );

        // Send simulated email alert
        emailService.sendEmail(
                donation.getDonor().getEmail(),
                "Donation Claimed: " + donation.getProduct().getName() + " | CirculateHub",
                "Hi " + donation.getDonor().getName() + ",\n\n" +
                "Good news! " + beneficiary.getName() + " has claimed your donation of '" + donation.getProduct().getName() + "'.\n" +
                "Please coordinate meetup and delivery details in the chat.\n\n" +
                "Thank you for supporting campus sustainability!\n\n" +
                "Best,\nCirculateHub Team"
        );

        return donationRepository.save(donation);
    }

    @Transactional
    public Donation updateTrackingStatus(Long donationId, DonationStatus status) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("Donation record not found!"));

        donation.setTrackingStatus(status);

        if (status == DonationStatus.DELIVERED) {
            Product product = donation.getProduct();
            product.setStatus(ProductStatus.REUSED);
            productRepository.save(product);

            // Award extra point bonus for completed delivery
            gamificationService.awardPoints(donation.getDonor(), 20);

            if (donation.getBeneficiary() != null) {
                notificationService.createNotification(
                        donation.getBeneficiary(),
                        "Your donation package for: " + product.getName() + " has been marked as delivered!",
                        NotificationType.DONATION_ACCEPTED
                );
            }
        }

        return donationRepository.save(donation);
    }

    public List<Donation> getActiveDonations() {
        return donationRepository.findAll().stream()
                .filter(d -> d.getTrackingStatus() != DonationStatus.DELIVERED)
                .toList();
    }
}
