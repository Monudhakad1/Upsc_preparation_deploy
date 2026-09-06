package com.upscmentor.backend.dto.dashboard;

import java.util.UUID;

public record SubjectProgressDto(
        UUID paperId,
        String paperCode,
        String paperName,
        int totalTopics,
        int completedTopics,
        double coveragePercent
) {}
