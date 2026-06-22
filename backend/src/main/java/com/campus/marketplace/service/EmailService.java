package com.campus.marketplace.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendEmail(String toEmail, String subject, String body) {
        System.out.println("=====================================================================");
        System.out.println("[EMAIL OUTBOX] Sending Outgoing Email...");
        System.out.println("To:      " + toEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Content:\n" + body);
        System.out.println("=====================================================================");
    }
}
