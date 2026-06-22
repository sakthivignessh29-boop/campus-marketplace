package com.campus.marketplace.controller;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.ProductRepository;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.DonationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    @Autowired
    private DonationService donationService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/active")
    public ResponseEntity<List<Donation>> getActiveDonations() {
        return ResponseEntity.ok(donationService.getActiveDonations());
    }

    @PostMapping("/initiate/{productId}")
    public ResponseEntity<?> initiateDonation(@PathVariable Long productId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User donor = userRepository.findById(principal.getId()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        if (!product.getSeller().getId().equals(donor.getId())) {
            return ResponseEntity.status(403).body("You are not the owner of this listing!");
        }

        Donation donation = donationService.initiateDonation(product, donor);
        return ResponseEntity.ok(donation);
    }

    @PostMapping("/match/{donationId}")
    public ResponseEntity<?> matchBeneficiary(@PathVariable Long donationId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User beneficiary = userRepository.findById(principal.getId()).orElseThrow();

        try {
            Donation donation = donationService.matchBeneficiary(donationId, beneficiary);
            return ResponseEntity.ok(donation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/status/{donationId}")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long donationId,
            @RequestParam DonationStatus status) {
        try {
            Donation donation = donationService.updateTrackingStatus(donationId, status);
            return ResponseEntity.ok(donation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
