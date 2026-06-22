package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.BadgeRepository;
import com.campus.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class GamificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public void awardPoints(User user, int points) {
        user.setEcoPoints(user.getEcoPoints() + points);
        
        // Sustainability score goes up as they participate
        user.setSustainabilityScore(user.getSustainabilityScore() + (points * 0.1));
        userRepository.save(user);

        checkAndAwardBadges(user);
    }

    @Transactional
    public void checkAndAwardBadges(User user) {
        int points = user.getEcoPoints();

        // 🌱 Eco Starter
        if (points >= 10 && !badgeRepository.existsByUserIdAndType(user.getId(), BadgeType.ECO_STARTER)) {
            saveBadge(user, BadgeType.ECO_STARTER, "🌱 Eco Starter! Earned your first points in the circular economy.");
        }
        // ♻ Recycler
        if (points >= 50 && !badgeRepository.existsByUserIdAndType(user.getId(), BadgeType.RECYCLER)) {
            saveBadge(user, BadgeType.RECYCLER, "♻ Recycler! Unlocked by earning 50+ EcoPoints.");
        }
        // 🌍 Sustainability Hero
        if (points >= 150 && !badgeRepository.existsByUserIdAndType(user.getId(), BadgeType.SUSTAINABILITY_HERO)) {
            saveBadge(user, BadgeType.SUSTAINABILITY_HERO, "🌍 Sustainability Hero! Unlocked by earning 150+ EcoPoints.");
        }
        // 🏆 Green Champion
        if (points >= 300 && !badgeRepository.existsByUserIdAndType(user.getId(), BadgeType.GREEN_CHAMPION)) {
            saveBadge(user, BadgeType.GREEN_CHAMPION, "🏆 Green Champion! You are a top contributor in the Circular campus community.");
        }
    }

    private void saveBadge(User user, BadgeType type, String message) {
        Badge badge = Badge.builder()
                .user(user)
                .type(type)
                .build();
        badgeRepository.save(badge);

        notificationService.createNotification(user, message, NotificationType.BADGE_EARNED);
    }

    public List<User> getLeaderboard() {
        return userRepository.findAll().stream()
                .sorted((u1, u2) -> u2.getEcoPoints().compareTo(u1.getEcoPoints()))
                .limit(10)
                .toList();
    }
}
