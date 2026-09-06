package com.upscmentor.backend.dto.dashboard;

import java.util.UUID;

public record PyqCoverageDto(
        UUID paperId,
        String paperCode,
        String paperName,
        int totalPyqs,
        int attemptedPyqs,
        double coveragePercent
) {}
