package com.upscmentor.backend.dto.dashboard;

import java.util.List;

public record DashboardOverviewDto(
        int totalTopics,
        int completedTopics,
        double syllabusCoveragePercent,
        RevisionDepthDto revisionDepth,
        List<SubjectProgressDto> subjects
) {}
