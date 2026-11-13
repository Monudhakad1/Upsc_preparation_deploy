package com.upscmentor.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

/**
 * Private UPSC Mentor-Aspirant progress dashboard.
 */
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        // "Today" (goal stats, default revision date) must follow Indian time, not
        // the host's clock - Render runs in UTC, which made 00:00-05:30 IST count
        // as the previous day. Override with APP_TIMEZONE if ever needed.
        String zone = System.getenv().getOrDefault("APP_TIMEZONE", "Asia/Kolkata");
        TimeZone.setDefault(TimeZone.getTimeZone(zone));
        SpringApplication.run(BackendApplication.class, args);
    }
}
