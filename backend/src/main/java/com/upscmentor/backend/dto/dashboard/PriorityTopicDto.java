package com.upscmentor.backend.dto.dashboard;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PriorityTopicDto(
        UUID topicId,
        String topicName,
        String areaName,
        String paperCode,
        Integer confidence,
        int revisionCount,
        Instant completedAt,
        LocalDate lastRevisionDate
) {}
