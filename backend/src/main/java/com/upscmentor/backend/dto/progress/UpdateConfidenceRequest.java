package com.upscmentor.backend.dto.progress;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateConfidenceRequest(@NotNull @Min(1) @Max(5) Integer confidence) {}
