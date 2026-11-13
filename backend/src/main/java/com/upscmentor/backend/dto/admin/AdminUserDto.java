package com.upscmentor.backend.dto.admin;

import com.upscmentor.backend.entity.User;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDto(
        UUID id,
        String email,
        String displayName,
        String role,
        boolean active,
        Instant createdAt
) {
    public static AdminUserDto from(User u) {
        return new AdminUserDto(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole().name(), u.isActive(), u.getCreatedAt());
    }
}
