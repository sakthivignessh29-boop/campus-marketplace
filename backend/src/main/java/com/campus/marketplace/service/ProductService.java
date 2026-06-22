package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AdminLogRepository adminLogRepository;

    @Autowired
    private GamificationService gamificationService;

    public List<Product> getAllAvailableProducts() {
        return productRepository.findByStatus(ProductStatus.AVAILABLE);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(Product product) {
        // Run AI Fraud Detection before saving
        boolean isFraud = detectListingFraud(product);
        if (isFraud) {
            product.setStatus(ProductStatus.PENDING); // Flag listing for admin review
            logAdminAlert(product, "AI Auto-Flag: Suspected fraudulent/spam listing detected by Gemini.");
        } else {
            product.setStatus(ProductStatus.AVAILABLE);
        }

        // Calculate a base sustainability score based on category
        double score = calculateDefaultSustainabilityScore(product.getCategory().getName());
        product.setSustainabilityScore(score);

        Product saved = productRepository.save(product);

        // Award points based on listing type
        if (product.getStatus() == ProductStatus.AVAILABLE) {
            int points = switch (product.getType()) {
                case SELL -> 10;
                case DONATE -> 20;
                case EXCHANGE -> 15;
                case RENT -> 8;
                case BUY -> 0;
            };
            if (points > 0) {
                gamificationService.awardPoints(product.getSeller(), points);
            }
        }

        return saved;
    }

    private double calculateDefaultSustainabilityScore(String category) {
        return switch (category.toLowerCase()) {
            case "textbooks" -> 5.0;
            case "electronics" -> 25.0;
            case "furniture" -> 50.0;
            case "lab equipment" -> 15.0;
            case "project components" -> 8.0;
            case "stationery" -> 2.0;
            default -> 10.0;
        };
    }

    private boolean detectListingFraud(Product product) {
        String prompt = "Review this marketplace listing for duplicates, suspicious prices, fake products, or spam content. " +
                "Respond strictly with a JSON object in this format: {\"fraudulent\": true/false, \"score\": 0.0-1.0, \"reason\": \"string\"}. " +
                "Listing details:\n" +
                "Name: " + product.getName() + "\n" +
                "Description: " + product.getDescription() + "\n" +
                "Price: ₹" + product.getPrice() + "\n" +
                "Category: " + product.getCategory().getName() + "\n" +
                "Type: " + product.getType();

        try {
            String aiResult = geminiService.generateText(prompt);
            // Quick check for fraudulent true in the raw response
            return aiResult.contains("\"fraudulent\": true") || aiResult.contains("\"fraudulent\":true");
        } catch (Exception e) {
            System.err.println("Fraud detection failed: " + e.getMessage());
            return false;
        }
    }

    private void logAdminAlert(Product product, String reason) {
        AdminLog log = AdminLog.builder()
                .action("AI_FRAUD_FLAG")
                .targetId(product.getId())
                .targetType("PRODUCT")
                .build();
        adminLogRepository.save(log);
    }

    @Transactional
    public boolean toggleWishlist(User user, Product product) {
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(user.getId(), product.getId());
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return false; // Removed
        } else {
            Wishlist wl = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .build();
            wishlistRepository.save(wl);
            return true; // Added
        }
    }

    public List<Wishlist> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }

    public List<Product> searchAndFilterProducts(String query, String categoryName, String type, String condition) {
        List<Product> products = productRepository.findByStatus(ProductStatus.AVAILABLE);

        return products.stream()
                .filter(p -> query == null || query.trim().isEmpty() || 
                        p.getName().toLowerCase().contains(query.toLowerCase()) || 
                        p.getDescription().toLowerCase().contains(query.toLowerCase()))
                .filter(p -> categoryName == null || categoryName.equalsIgnoreCase("all") || 
                        p.getCategory().getName().equalsIgnoreCase(categoryName))
                .filter(p -> type == null || type.equalsIgnoreCase("all") || 
                        p.getType().name().equalsIgnoreCase(type))
                .filter(p -> condition == null || condition.equalsIgnoreCase("all") || 
                        p.getItemCondition().equalsIgnoreCase(condition))
                .toList();
    }
}
