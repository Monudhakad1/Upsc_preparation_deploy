package com.upscmentor.backend.dto.goal;

public record GoalStatsDto(
        int todayCompleted,
        int todayTotal,
        int weekCompleted,
        int weekTotal,
        int monthCompleted,
        int monthTotal
) {}
