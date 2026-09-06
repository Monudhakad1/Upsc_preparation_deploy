package com.upscmentor.backend.dto.progress;

import java.time.LocalDate;
import java.util.UUID;

/** Powers the syllabus tree's status dots without a per-topic round trip. */
public record TopicProgressSummaryDto(
        UUID topicId,
        String status,
        Integer confidence,
        int revisionCount,
        LocalDate lastRevisionDate
) {}
