package com.upscmentor.backend.config;

import com.upscmentor.backend.entity.Role;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * This app has exactly two accounts (spec section 2: no public registration).
 * Rather than a manual SQL insert with a hand-hashed password, both accounts
 * are created on first boot from environment variables, so credentials never
 * touch git or a migration file. Safe to leave running - it no-ops once the
 * accounts already exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.mentor-email}")
    private String mentorEmail;
    @Value("${app.seed.mentor-password}")
    private String mentorPassword;
    @Value("${app.seed.mentor-name:Mentor}")
    private String mentorName;

    @Value("${app.seed.aspirant-email}")
    private String aspirantEmail;
    @Value("${app.seed.aspirant-password}")
    private String aspirantPassword;
    @Value("${app.seed.aspirant-name:Aspirant}")
    private String aspirantName;

    @Override
    public void run(String... args) {
        User aspirant = userRepository.findByEmailIgnoreCase(aspirantEmail).orElseGet(() -> {
            log.info("Seeding aspirant account for {}", aspirantEmail);
            return userRepository.save(User.builder()
                    .email(aspirantEmail)
                    .displayName(aspirantName)
                    .passwordHash(passwordEncoder.encode(aspirantPassword))
                    .role(Role.ASPIRANT)
                    .active(true)
                    .build());
        });

        userRepository.findByEmailIgnoreCase(mentorEmail).orElseGet(() -> {
            log.info("Seeding mentor account for {}", mentorEmail);
            return userRepository.save(User.builder()
                    .email(mentorEmail)
                    .displayName(mentorName)
                    .passwordHash(passwordEncoder.encode(mentorPassword))
                    .role(Role.MENTOR)
                    .linkedAspirantId(aspirant.getId())
                    .active(true)
                    .build());
        });
    }
}
