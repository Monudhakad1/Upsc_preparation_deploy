package com.upscmentor.backend.dto.syllabus;

import java.util.List;
import java.util.UUID;

public record PaperDto(
        UUID id,
        String code,
        String name,
        String examStage,
        int displayOrder,
        List<AreaDto> areas
) {}
