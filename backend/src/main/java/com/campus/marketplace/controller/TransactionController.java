package com.campus.marketplace.controller;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.ProductRepository;
import com.campus.marketplace.repository.TransactionRepository;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.GamificationService;
import com.campus.marketplace.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.campus.marketplace.service.RazorpayService razorpayService;

    @Autowired
    private com.campus.marketplace.service.EmailService emailService;

    @PostMapping("/purchase/{productId}")
    @Transactional
    public ResponseEntity<?> purchaseProduct(
            @PathVariable Long productId,
            @RequestBody Map<String, String> payload) {
        
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User buyer = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found!"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        if (product.getStatus() != ProductStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("Product is no longer available for purchase!");
        }

        if (product.getSeller().getId().equals(buyer.getId())) {
            return ResponseEntity.badRequest().body("You cannot buy your own product!");
        }

        String paymentMethod = payload.getOrDefault("paymentMethod", "CARD");
        int pointsToTransfer = 0;

        if ("ECO_POINTS".equalsIgnoreCase(paymentMethod)) {
            int priceInPoints = product.getPrice().intValue();
            if (buyer.getEcoPoints() < priceInPoints) {
                return ResponseEntity.badRequest().body("Insufficient EcoPoints balance! You need " + priceInPoints + " EP.");
            }
            // Transfer points
            buyer.setEcoPoints(buyer.getEcoPoints() - priceInPoints);
            // Sustainability score adjusted
            buyer.setSustainabilityScore(buyer.getSustainabilityScore() - (priceInPoints * 0.1));
            
            User seller = product.getSeller();
            seller.setEcoPoints(seller.getEcoPoints() + priceInPoints);
            seller.setSustainabilityScore(seller.getSustainabilityScore() + (priceInPoints * 0.1));
            
            userRepository.save(buyer);
            userRepository.save(seller);
            pointsToTransfer = priceInPoints;
        }

        // Set product status to REUSED (i.e. sold/exchanged)
        product.setStatus(ProductStatus.REUSED);
        productRepository.save(product);

        // Build transaction
        Transaction transaction = Transaction.builder()
                .product(product)
                .buyer(buyer)
                .seller(product.getSeller())
                .type(product.getType())
                .pointsTransferred(pointsToTransfer)
                .status(TransactionStatus.COMPLETED)
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Award bonus gamification points for completed deal
        // Buyer gets 15 points, Seller gets 10 points
        gamificationService.awardPoints(buyer, 15);
        gamificationService.awardPoints(product.getSeller(), 10);

        // Send real-time notifications
        notificationService.createNotification(
                product.getSeller(),
                "Your listing '" + product.getName() + "' has been purchased by " + buyer.getName() + " via " + paymentMethod + "!",
                NotificationType.PRODUCT_SOLD
        );

        notificationService.createNotification(
                buyer,
                "Purchase successful! You secured '" + product.getName() + "'. Please coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point"),
                NotificationType.PRODUCT_SOLD
        );

        // Send simulated emails
        emailService.sendEmail(
                product.getSeller().getEmail(),
                "Listing Sold: " + product.getName() + " | CirculateHub",
                "Hi " + product.getSeller().getName() + ",\n\n" +
                "Congratulations! Your item '" + product.getName() + "' has been purchased by " + buyer.getName() + ".\n" +
                "Please coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point") + "\n\n" +
                "Best,\nCirculateHub Team"
        );
        emailService.sendEmail(
                buyer.getEmail(),
                "Purchase Confirmed: " + product.getName() + " | CirculateHub",
                "Hi " + buyer.getName() + ",\n\n" +
                "Success! You have secured '" + product.getName() + "' from " + product.getSeller().getName() + ".\n" +
                "Coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point") + "\n\n" +
                "Best,\nCirculateHub Team"
        );

        return ResponseEntity.ok(savedTransaction);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Transaction>> getTransactionHistory() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Transaction> bought = transactionRepository.findByBuyerId(principal.getId());
        List<Transaction> sold = transactionRepository.findBySellerId(principal.getId());

        List<Transaction> all = new ArrayList<>();
        all.addAll(bought);
        all.addAll(sold);
        all.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));

        return ResponseEntity.ok(all);
    }

    @PostMapping("/razorpay/create-order/{productId}")
    public ResponseEntity<?> createRazorpayOrder(@PathVariable Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        if (product.getStatus() != ProductStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("Product is no longer available!");
        }

        Map<String, Object> orderDetails = razorpayService.createOrder(
                product.getPrice(),
                "receipt_prod_" + productId + "_" + System.currentTimeMillis()
        );
        return ResponseEntity.ok(orderDetails);
    }

    @PostMapping("/razorpay/verify-payment")
    @Transactional
    public ResponseEntity<?> verifyRazorpayPayment(@RequestBody Map<String, String> payload) {
        String orderId = payload.get("razorpayOrderId");
        String paymentId = payload.get("razorpayPaymentId");
        String signature = payload.get("razorpaySignature");
        Long productId = Long.parseLong(payload.get("productId"));
        String paymentMethod = payload.getOrDefault("paymentMethod", "CARD");

        boolean isValid = razorpayService.verifySignature(orderId, paymentId, signature);
        if (!isValid) {
            return ResponseEntity.status(400).body("Invalid payment signature verified. Transaction declined!");
        }

        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User buyer = userRepository.findById(principal.getId()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        if (product.getStatus() != ProductStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("Product is no longer available!");
        }

        product.setStatus(ProductStatus.REUSED);
        productRepository.save(product);

        Transaction transaction = Transaction.builder()
                .product(product)
                .buyer(buyer)
                .seller(product.getSeller())
                .type(product.getType())
                .pointsTransferred(0)
                .status(TransactionStatus.COMPLETED)
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);

        gamificationService.awardPoints(buyer, 15);
        gamificationService.awardPoints(product.getSeller(), 10);

        notificationService.createNotification(
                product.getSeller(),
                "Your listing '" + product.getName() + "' has been purchased by " + buyer.getName() + " via Razorpay!",
                NotificationType.PRODUCT_SOLD
        );

        notificationService.createNotification(
                buyer,
                "Purchase successful! You secured '" + product.getName() + "' via Razorpay. Please coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point"),
                NotificationType.PRODUCT_SOLD
        );

        // Send simulated emails
        emailService.sendEmail(
                product.getSeller().getEmail(),
                "Listing Sold: " + product.getName() + " | CirculateHub",
                "Hi " + product.getSeller().getName() + ",\n\n" +
                "Congratulations! Your item '" + product.getName() + "' has been purchased by " + buyer.getName() + " via Razorpay.\n" +
                "Please coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point") + "\n\n" +
                "Best,\nCirculateHub Team"
        );
        emailService.sendEmail(
                buyer.getEmail(),
                "Purchase Confirmed: " + product.getName() + " | CirculateHub",
                "Hi " + buyer.getName() + ",\n\n" +
                "Success! You have secured '" + product.getName() + "' from " + product.getSeller().getName() + " via Razorpay.\n" +
                "Coordinate pickup at: " + (product.getPickupLocationName() != null ? product.getPickupLocationName() : "Campus Point") + "\n\n" +
                "Best,\nCirculateHub Team"
        );

        return ResponseEntity.ok(savedTransaction);
    }
}
