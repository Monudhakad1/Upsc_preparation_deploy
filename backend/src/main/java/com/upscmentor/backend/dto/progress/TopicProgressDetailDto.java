package com.upscmentor.backend.dto.progress;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TopicProgressDetailDto(
        UUID topicId,
        String status,
        Integer confidence,
        Instant completedAt,
        List<RevisionDto> revisions
) {}
