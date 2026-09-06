package com.upscmentor.backend.dto;

import java.util.UUID;

public record LoginResponse(
        String token,
        UUID userId,
        String email,
        String displayName,
        String role
) {}
