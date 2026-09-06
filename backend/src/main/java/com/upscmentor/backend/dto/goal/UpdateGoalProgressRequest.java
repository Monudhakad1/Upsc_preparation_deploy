package com.upscmentor.backend.dto.goal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateGoalProgressRequest(@NotNull String status, @Min(0) Integer completedCount) {}
