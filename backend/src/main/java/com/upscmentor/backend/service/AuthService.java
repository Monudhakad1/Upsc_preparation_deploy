package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.LoginRequest;
import com.upscmentor.backend.dto.LoginResponse;
import com.upscmentor.backend.dto.RegisterRequest;
import com.upscmentor.backend.entity.Role;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.UserRepository;
import com.upscmentor.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(ApiException::badCredentials);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.badCredentials();
        }
        // Only reported after the password matched, so it can't be used to probe emails.
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been deactivated. Contact your mentor.");
        }
        return toResponse(user);
    }

    /** Public sign-up: always an ASPIRANT. Mentor accounts are created only by a mentor. */
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        User user = createUser(request.displayName(), request.email(), request.password(), Role.ASPIRANT);
        return toResponse(user);
    }

    @Transactional
    public User createUser(String displayName, String email, String password, Role role) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict("An account with this email already exists.");
        }
        return userRepository.save(User.builder()
                .email(normalizedEmail)
                .displayName(displayName.trim())
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .active(true)
                .build());
    }

    private LoginResponse toResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new LoginResponse(token, user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }
}
