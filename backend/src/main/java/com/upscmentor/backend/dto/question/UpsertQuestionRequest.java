package com.upscmentor.backend.dto.question;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record UpsertQuestionRequest(
        UUID topicId,
        UUID paperId,
        @NotBlank String question,
        @NotNull String type,
        @Min(0) Integer marks,
        String difficulty,
        @Min(0) Integer timeLimitMinutes,
        LocalDate deadline,
        String instructions,
        String priority
) {}
