package com.campus.marketplace.controller;

import com.campus.marketplace.dto.MessageDto;
import com.campus.marketplace.model.*;
import com.campus.marketplace.repository.ProductRepository;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/active-chats")
    public ResponseEntity<List<User>> getActiveChats() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(messageService.getActiveChats(principal.getId()));
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<Message>> getChatHistory(@PathVariable Long otherUserId) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(messageService.getChatHistory(principal.getId(), otherUserId));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendRestMessage(@RequestBody MessageDto messageDto) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User sender = userRepository.findById(principal.getId()).orElseThrow();
        User receiver = userRepository.findById(messageDto.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found!"));

        Product product = null;
        if (messageDto.getProductId() != null) {
            product = productRepository.findById(messageDto.getProductId()).orElse(null);
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(messageDto.getContent())
                .product(product)
                .imageUrl(messageDto.getImageUrl())
                .build();

        Message saved = messageService.sendMessage(message);
        return ResponseEntity.ok(saved);
    }

    @MessageMapping("/chat")
    public void processMessage(MessageDto messageDto, Principal principal) {
        if (principal == null) return;
        
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender == null) return;

        User receiver = userRepository.findById(messageDto.getReceiverId()).orElse(null);
        if (receiver == null) return;

        Product product = null;
        if (messageDto.getProductId() != null) {
            product = productRepository.findById(messageDto.getProductId()).orElse(null);
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(messageDto.getContent())
                .product(product)
                .imageUrl(messageDto.getImageUrl())
                .build();

        messageService.sendMessage(message);
    }
}
