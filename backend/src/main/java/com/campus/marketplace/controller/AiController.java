package com.campus.marketplace.controller;

import com.campus.marketplace.model.User;
import com.campus.marketplace.security.UserPrincipal;
import com.campus.marketplace.service.GeminiService;
import com.campus.marketplace.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private MessageService messageService;

    @PostMapping("/chat")
    public ResponseEntity<?> chatWithEcoGuide(@RequestBody Map<String, String> payload) {
        String prompt = payload.get("message");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message prompt is required!");
        }

        // Retrieve current authenticated student and their active chat partners
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getId();
        List<User> activeChatPartners = messageService.getActiveChats(userId);

        StringBuilder chatContext = new StringBuilder("\nYou have access to the user's active chats with other students on the platform:\n");
        if (activeChatPartners.isEmpty()) {
            chatContext.append("- The user currently has no active chats with other students.\n");
        } else {
            for (User u : activeChatPartners) {
                chatContext.append("- ").append(u.getName()).append(" (Email: ").append(u.getEmail()).append(", ID: ").append(u.getId()).append(")\n");
            }
        }

        String systemInstruction = "You are EcoGuide AI (🌱), a helpful circular economy assistant for SRM Easwari Engineering College. " +
                "Assist students in finding books, electronics, hostel gear, lab kits. Provide suggestions on recycling, " +
                "donating materials, and calculating carbon savings. Keep responses concise and engaging.\n" +
                chatContext.toString() + "\n" +
                "User query: " + prompt;

        String response = geminiService.generateText(systemInstruction);
        return ResponseEntity.ok(Map.of("reply", response));
    }

    @PostMapping("/advisor")
    public ResponseEntity<?> getAdvisorAdvice(@RequestBody Map<String, String> payload) {
        String actionType = payload.get("action");
        String detail = payload.get("detail");

        String prompt = "Provide eco-friendly actions, reuse opportunities, or donation suggestions for: " +
                actionType + " (Detail: " + detail + "). Keep it under 3 bullet points with a brief summary of carbon footprint reduction.";

        String response = geminiService.generateText(prompt);
        return ResponseEntity.ok(Map.of("advice", response));
    }
}
