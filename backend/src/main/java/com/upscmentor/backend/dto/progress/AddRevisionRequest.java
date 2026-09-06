package com.upscmentor.backend.dto.progress;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

/** All fields optional except nothing is strictly required - revisionDate defaults to today. */
public record AddRevisionRequest(
        LocalDate revisionDate,
        @Min(0) Integer durationMinutes,
        @Min(1) @Max(5) Integer confidence,
        String notes,
        String mentorNote
) {}
