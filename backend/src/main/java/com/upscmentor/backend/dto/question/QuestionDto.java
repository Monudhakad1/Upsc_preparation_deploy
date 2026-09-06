package com.upscmentor.backend.dto.question;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record QuestionDto(
        UUID id,
        UUID topicId,
        String topicName,
        UUID paperId,
        String paperCode,
        String question,
        String type,
        Integer marks,
        String difficulty,
        Integer timeLimitMinutes,
        LocalDate deadline,
        String instructions,
        String priority,
        SubmissionSummaryDto submission,
        Instant createdAt
) {}
