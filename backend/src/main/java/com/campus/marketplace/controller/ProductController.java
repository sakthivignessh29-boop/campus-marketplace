package com.campus.marketplace.controller;

import com.campus.marketplace.dto.ProductDto;
import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.CategoryRepository;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.GeminiService;
import com.campus.marketplace.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts() {
        return ResponseEntity.ok(productService.getAllAvailableProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductDto productDto) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User seller = userRepository.findById(principal.getId()).orElseThrow();
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found!"));

        Product product = Product.builder()
                .name(productDto.getName())
                .description(productDto.getDescription())
                .price(productDto.getPrice())
                .itemCondition(productDto.getItemCondition())
                .category(category)
                .type(productDto.getType())
                .seller(seller)
                .imageUrl(productDto.getImageUrl())
                .latitude(productDto.getLatitude())
                .longitude(productDto.getLongitude())
                .pickupLocationName(productDto.getPickupLocationName())
                .build();

        Product saved = productService.createProduct(product);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String condition) {
        return ResponseEntity.ok(productService.searchAndFilterProducts(query, category, type, condition));
    }

    @PostMapping("/ai-generate-description")
    public ResponseEntity<?> aiGenerateDescription(@RequestBody Map<String, String> payload) {
        String base64Image = payload.get("image");
        if (base64Image == null || base64Image.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Image data is required!");
        }

        String prompt = "Analyze this product image and generate a title, description, and estimated price (in INR) for a campus circular economy marketplace. " +
                "Respond strictly in this JSON format: {\"title\": \"string\", \"description\": \"string\", \"estimatedPrice\": 0.0, \"sustainabilityScore\": 0.0-10.0}.";

        String aiResult = geminiService.generateFromImage(base64Image, prompt);
        return ResponseEntity.ok(aiResult);
    }

    @GetMapping("/ai-categorize")
    public ResponseEntity<?> aiCategorize(@RequestParam String title) {
        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Title is required!");
        }
        String prompt = "Given the product title: \"" + title + "\", select the most appropriate category from this list: " +
                "[Textbooks, Electronics, Furniture, Lab Equipment, Project Components, Hostel Essentials, Sports Items, Stationery]. " +
                "Respond with ONLY the exact category name from the list, with no other text, quotes, or explanation. If none fit, return \"Stationery\".";
        
        String categoryName = geminiService.generateText(prompt).trim();
        // Clean markdown backticks or quotes if Gemini includes them
        categoryName = categoryName.replaceAll("`|\"|'|\\.", "");
        return ResponseEntity.ok(Map.of("category", categoryName));
    }

    @PostMapping("/ai-suggest-price")
    public ResponseEntity<?> aiSuggestPrice(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        String condition = payload.get("condition");
        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Title is required!");
        }
        String prompt = "Recommend a fair market price range in INR for this pre-owned college campus item:\n" +
                "Title: " + title + "\n" +
                "Condition: " + (condition != null ? condition : "GOOD") + "\n\n" +
                "Respond strictly in this JSON format:\n" +
                "{\n" +
                "  \"suggestedPrice\": 450,\n" +
                "  \"minPrice\": 400,\n" +
                "  \"maxPrice\": 500,\n" +
                "  \"justification\": \"short explanation\"\n" +
                "}";

        String response = geminiService.generateText(prompt);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ai-scam-detect/{productId}")
    public ResponseEntity<?> aiScamDetect(@PathVariable Long productId) {
        Product product = productService.getProductById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found!"));
        
        String prompt = "Analyze this product listing for potential scam or fraudulent activity:\n" +
                "Title: " + product.getName() + "\n" +
                "Description: " + product.getDescription() + "\n" +
                "Price: " + product.getPrice() + " INR\n" +
                "Condition: " + product.getItemCondition() + "\n" +
                "Category: " + product.getCategory().getName() + "\n\n" +
                "Respond strictly in this JSON format:\n" +
                "{\n" +
                "  \"fraudulent\": true/false,\n" +
                "  \"score\": 0.0-1.0,\n" +
                "  \"reason\": \"short explanation of risk assessment\"\n" +
                "}";

        String response = geminiService.generateText(prompt);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ai-smart-search")
    public ResponseEntity<List<Product>> aiSmartSearch(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(productService.getAllAvailableProducts());
        }
        List<Product> allProducts = productService.getAllAvailableProducts();
        if (allProducts.isEmpty()) {
            return ResponseEntity.ok(allProducts);
        }

        // Format products catalog briefly for Gemini
        StringBuilder catalog = new StringBuilder();
        for (Product p : allProducts) {
            catalog.append("ID: ").append(p.getId())
                    .append(" | Name: ").append(p.getName())
                    .append(" | Price: INR ").append(p.getPrice())
                    .append(" | Category: ").append(p.getCategory().getName())
                    .append(" | Description: ").append(p.getDescription()).append("\n");
        }

        String prompt = "You are a search assistant for a campus circular economy marketplace.\n" +
                "Given the student's natural language query: \"" + query + "\"\n" +
                "And this list of available products:\n" +
                catalog.toString() + "\n" +
                "Filter and return only the product IDs that match the search query (e.g. matching category, item type, price threshold, etc.).\n" +
                "Respond strictly in this JSON format:\n" +
                "{\n" +
                "  \"matchingIds\": [1, 2, 3]\n" +
                "}\n" +
                "If no matches are found, return an empty array.";

        try {
            String aiResponse = geminiService.generateText(prompt);
            // Quick check to see if each product ID exists in the matching array
            List<Product> filtered = new ArrayList<>();
            for (Product p : allProducts) {
                if (aiResponse.contains(String.valueOf(p.getId()))) {
                    filtered.add(p);
                }
            }
            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            System.err.println("AI Smart Search failed: " + e.getMessage() + ". Falling back to query search.");
            return ResponseEntity.ok(productService.searchAndFilterProducts(query, null, null, null));
        }
    }
}
