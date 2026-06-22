package com.campus.marketplace.config;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Categories
        List<String> defaultCategories = Arrays.asList(
                "Textbooks", "Electronics", "Furniture", "Lab Equipment",
                "Project Components", "Hostel Essentials", "Sports Items", "Stationery"
        );

        for (String catName : defaultCategories) {
            if (categoryRepository.findByName(catName).isEmpty()) {
                categoryRepository.save(Category.builder().name(catName).build());
            }
        }

        // Seed Admin if no users exist
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .name("Campus Admin")
                    .email("admin@campuscirculate.edu")
                    .password(passwordEncoder.encode("admin123"))
                    .college("National Institute of Technology")
                    .department("Administration")
                    .year(4)
                    .role(Role.ADMIN)
                    .ecoPoints(100)
                    .sustainabilityScore(10.0)
                    .build();
            userRepository.save(admin);
            System.out.println("Seeded Default Admin: admin@campuscirculate.edu / admin123");
        }
    }
}
