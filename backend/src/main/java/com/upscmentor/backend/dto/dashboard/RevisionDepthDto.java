package com.upscmentor.backend.dto.dashboard;

/**
 * R1-R5 coverage among COMPLETED topics only (spec section 34). Deliberately
 * never conflated with syllabus completion - a topic can be 100% "syllabus
 * complete" and 0% revised at the same time (spec section 35), and the UI
 * must be able to show both facts side by side.
 */
public record RevisionDepthDto(
        double r1Percent,
        double r2Percent,
        double r3Percent,
        double r4Percent,
        double r5Percent,
        double averageRevisionCount
) {}
