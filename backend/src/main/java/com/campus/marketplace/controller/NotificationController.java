package com.campus.marketplace.controller;

import com.campus.marketplace.model.Notification;
import com.campus.marketplace.model.NotificationType;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(notificationService.getUserNotifications(principal.getId()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(notificationService.getUnreadNotifications(principal.getId()));
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok("Notification marked as read");
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok("All notifications marked as read");
    }

    @PostMapping("/read-non-messages")
    public ResponseEntity<?> markNonMessagesAsRead() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        notificationService.markNonMessageNotificationsAsRead(principal.getId());
        return ResponseEntity.ok("Non-message notifications marked as read");
    }

    @PostMapping("/read-type/{type}")
    public ResponseEntity<?> markTypeAsRead(@PathVariable NotificationType type) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        notificationService.markNotificationsOfTypeAsRead(principal.getId(), type);
        return ResponseEntity.ok("Notifications of type " + type + " marked as read");
    }
}
