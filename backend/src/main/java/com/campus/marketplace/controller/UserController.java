package com.campus.marketplace.controller;

import com.campus.marketplace.model.Product;
import com.campus.marketplace.model.User;
import com.campus.marketplace.repository.ProductRepository;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.GamificationService;
import com.campus.marketplace.service.ProductService;
import com.campus.marketplace.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getLeaderboard() {
        return ResponseEntity.ok(gamificationService.getLeaderboard());
    }

    @GetMapping("/wishlist")
    public ResponseEntity<?> getMyWishlist() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(productService.getUserWishlist(principal.getId()));
    }

    @PostMapping("/wishlist/toggle/{productId}")
    public ResponseEntity<?> toggleWishlist(@PathVariable Long productId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));

        boolean added = productService.toggleWishlist(user, product);
        return ResponseEntity.ok(added ? "Added to wishlist" : "Removed from wishlist");
    }
}
