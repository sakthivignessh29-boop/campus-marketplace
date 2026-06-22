package com.campus.marketplace.service;

import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.MessageRepository;
import com.campus.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Message sendMessage(Message message) {
        Message saved = messageRepository.save(message);

        // Real-time dispatch via WebSocket to specific queue
        try {
            messagingTemplate.convertAndSendToUser(
                    saved.getReceiver().getEmail(),
                    "/queue/messages",
                    saved
            );
        } catch (Exception e) {
            System.err.println("Failed to dispatch real-time WebSocket message: " + e.getMessage());
        }

        // Fire notification for offline or in-app visual alert
        notificationService.createNotification(
                saved.getReceiver(),
                "New message from " + saved.getSender().getName() + ": " + 
                (saved.getContent().length() > 30 ? saved.getContent().substring(0, 27) + "..." : saved.getContent()),
                NotificationType.NEW_MESSAGE
        );

        // Send simulated email alert
        emailService.sendEmail(
                saved.getReceiver().getEmail(),
                "New Message from " + saved.getSender().getName() + " | CirculateHub",
                "Hi " + saved.getReceiver().getName() + ",\n\n" +
                "You have received a new message from " + saved.getSender().getName() + ":\n\n" +
                "\"" + saved.getContent() + "\"\n\n" +
                "Log in to http://localhost:5173/chat to reply.\n\n" +
                "Best,\nCirculateHub Team"
        );

        return saved;
    }

    public List<Message> getChatHistory(Long user1Id, Long user2Id) {
        List<Message> history = messageRepository.findChatHistory(user1Id, user2Id);
        history.stream()
                .filter(m -> m.getReceiver().getId().equals(user1Id) && !m.getIsRead())
                .forEach(m -> {
                    m.setIsRead(true);
                    messageRepository.save(m);
                });
        return history;
    }

    public List<User> getActiveChats(Long userId) {
        List<Long> activeIds = messageRepository.findActiveChatUserIds(userId);
        List<User> activeUsers = new ArrayList<>();
        for (Long id : activeIds) {
            if (!id.equals(userId)) {
                userRepository.findById(id).ifPresent(activeUsers::add);
            }
        }
        return activeUsers;
    }
}
