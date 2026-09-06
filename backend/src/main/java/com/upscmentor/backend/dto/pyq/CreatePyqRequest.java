package com.upscmentor.backend.dto.pyq;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreatePyqRequest(
        @NotNull UUID paperId,
        @Min(1990) int year,
        @NotBlank String question,
        @Min(0) Integer marks,
        List<UUID> topicIds
) {}
