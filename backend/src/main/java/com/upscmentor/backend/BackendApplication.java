package com.upscmentor.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Private UPSC Mentor-Aspirant progress dashboard.
 *
 * Phase 1 scope: project setup, PostgreSQL, JWT authentication, User/Role model.
 * Later phases (syllabus hierarchy, revisions, PYQs, goals, current affairs, etc.)
 * are added incrementally on top of this foundation - see README.md.
 */
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
