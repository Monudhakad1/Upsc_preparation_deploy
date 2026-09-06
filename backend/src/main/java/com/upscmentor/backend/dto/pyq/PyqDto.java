package com.upscmentor.backend.dto.pyq;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PyqDto(
        UUID id,
        UUID paperId,
        String paperCode,
        String paperName,
        int year,
        String question,
        Integer marks,
        String attemptStatus,
        Integer answerQuality,
        String analysisNotes,
        boolean modelAnswerReviewed,
        boolean reattempted,
        List<TopicRefDto> topics,
        Instant createdAt,
        Instant updatedAt
) {}
