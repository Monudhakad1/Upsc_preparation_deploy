package com.upscmentor.backend.dto.progress;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RevisionDto(
        UUID id,
        int revisionNumber,
        LocalDate revisionDate,
        Integer durationMinutes,
        Integer confidence,
        String notes,
        String mentorNote,
        Instant createdAt
) {}
