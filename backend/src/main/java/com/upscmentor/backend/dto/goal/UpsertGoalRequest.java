package com.upscmentor.backend.dto.goal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpsertGoalRequest(
        @NotBlank String title,
        @NotNull String category,
        @NotNull LocalDate goalDate,
        String priority,
        String description,
        @Min(0) Integer targetCount,
        String mentorNote
) {}
