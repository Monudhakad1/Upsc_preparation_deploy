package com.upscmentor.backend.dto.goal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyGoalDto(
        UUID id,
        String title,
        String category,
        LocalDate goalDate,
        String priority,
        String description,
        String status,
        Integer targetCount,
        int completedCount,
        Instant completedAt,
        String mentorNote,
        Instant createdAt
) {}
