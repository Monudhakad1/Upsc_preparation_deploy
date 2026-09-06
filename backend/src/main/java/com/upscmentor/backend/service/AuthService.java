package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.LoginRequest;
import com.upscmentor.backend.dto.LoginResponse;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.UserRepository;
import com.upscmentor.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(ApiException::badCredentials);

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.badCredentials();
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new LoginResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name()
        );
    }
}
