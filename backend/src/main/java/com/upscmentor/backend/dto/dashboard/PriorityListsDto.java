package com.upscmentor.backend.dto.dashboard;

import java.util.List;

/**
 * Spec section 14's four buckets, computed purely from completed topics'
 * revision counts:
 *   CRITICAL     - completed, 0 revisions ("completed but never revised")
 *   HIGH         - completed, exactly 1 revision
 *   MEDIUM       - completed, 2-4 revisions
 *   WELL_REVISED - completed, 5+ revisions
 *
 * lowConfidence is a separate cross-cutting list (spec section 15): a topic
 * with 5 revisions but confidence 2 must still surface as weak, even though
 * its revision count alone would put it in wellRevised.
 */
public record PriorityListsDto(
        List<PriorityTopicDto> critical,
        List<PriorityTopicDto> high,
        List<PriorityTopicDto> medium,
        List<PriorityTopicDto> wellRevised,
        List<PriorityTopicDto> lowConfidence
) {}
