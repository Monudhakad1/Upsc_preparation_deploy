package com.upscmentor.backend.dto.question;

import java.time.Instant;
import java.util.UUID;

public record SubmissionSummaryDto(
        UUID id,
        String textAnswer,
        boolean hasAttachment,
        String fileName,
        String fileContentType,
        String mentorFeedback,
        boolean reviewedByMentor,
        Instant submittedAt
) {}
