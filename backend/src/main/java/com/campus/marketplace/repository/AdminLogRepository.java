package com.campus.marketplace.repository;

import com.campus.marketplace.model.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
    List<AdminLog> findAllByOrderByTimestampDesc();
}
