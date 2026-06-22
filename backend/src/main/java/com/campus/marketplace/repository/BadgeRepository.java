package com.campus.marketplace.repository;

import com.campus.marketplace.model.Badge;
import com.campus.marketplace.model.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByUserId(Long userId);
    boolean existsByUserIdAndType(Long userId, BadgeType type);
}
