package com.reon.order_backend.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {
    @Value("${email.sender}")
    private String emailSender;

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOrderSuccessEmail(String to, String subject, String body) {
        log.info("Sending order success email to: {}",to);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailSender);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("Order success email sent to: {}",to);
    }

    @Override
    public void sendOrderStatusEmail(String to, String subject, String body) {
        log.info("Sending order status email to: {}",to);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailSender);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("Order status email sent to: {}",to);
    }
}
