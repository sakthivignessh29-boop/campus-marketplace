package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        // Validate College Email Domain
        String email = user.getEmail().toLowerCase();
        if (!email.endsWith(".edu") && !email.endsWith(".ac.in") && !email.contains("college") && !email.contains("univ")) {
            throw new IllegalArgumentException("Please use a valid college email address (ending in .edu or .ac.in)!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(userRepository.count() == 0 ? Role.ADMIN : Role.STUDENT); // Make first user Admin
        user.setSustainabilityScore(0.0);
        user.setEcoPoints(0);

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Map<String, Object> getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        List<Badge> badges = badgeRepository.findByUserId(id);
        List<Product> activeListings = productRepository.findBySellerId(id).stream()
                .filter(p -> p.getStatus() == ProductStatus.AVAILABLE)
                .toList();

        // Calculate campus contribution savings
        // User saves money when buying reused items, and reduces waste
        double totalSavings = 0.0;
        int itemsReused = 0;
        double co2Saved = 0.0;

        List<Transaction> transactionsAsBuyer = transactionRepository.findByBuyerId(id);
        for (Transaction t : transactionsAsBuyer) {
            if (t.getStatus() == TransactionStatus.COMPLETED) {
                itemsReused++;
                co2Saved += t.getProduct().getSustainabilityScore();
                // Assumed savings: 50% of original price estimation
                totalSavings += t.getProduct().getPrice() * 0.5;
            }
        }

        List<Transaction> transactionsAsSeller = transactionRepository.findBySellerId(id);
        List<Transaction> allTransactions = new ArrayList<>();
        allTransactions.addAll(transactionsAsBuyer);
        allTransactions.addAll(transactionsAsSeller);
        allTransactions.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));

        Map<String, Object> profile = new HashMap<>();
        profile.put("user", user);
        profile.put("badges", badges);
        profile.put("listings", activeListings);
        profile.put("transactions", allTransactions);
        profile.put("impact", Map.of(
                "itemsReused", itemsReused,
                "co2SavedKg", co2Saved,
                "financialSavings", totalSavings
        ));

        return profile;
    }
}
