package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.progress.RevisionDto;
import com.upscmentor.backend.dto.progress.TopicProgressDetailDto;
import com.upscmentor.backend.dto.progress.TopicProgressSummaryDto;
import com.upscmentor.backend.entity.Topic;
import com.upscmentor.backend.entity.TopicProgress;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.RevisionRepository;
import com.upscmentor.backend.repository.TopicProgressRepository;
import com.upscmentor.backend.repository.TopicRepository;
import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TopicProgressService {

    private final TopicProgressRepository topicProgressRepository;
    private final RevisionRepository revisionRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    /**
     * Read-only: never creates a row. A topic nobody has touched yet simply
     * has no topic_progress record, and is reported as NOT_STARTED - seeding
     * 469 blank rows up front would be pure waste.
     */
    @Transactional(readOnly = true)
    public TopicProgressDetailDto getDetail(UUID topicId, UUID aspirantId) {
        return topicProgressRepository.findByTopicIdAndAspirantId(topicId, aspirantId)
                .map(this::toDetailDto)
                .orElseGet(() -> new TopicProgressDetailDto(topicId, "NOT_STARTED", null, null, List.of()));
    }

    /** Powers the syllabus tree's status dots - only returns topics that have a row at all. */
    @Transactional(readOnly = true)
    public List<TopicProgressSummaryDto> getAllSummaries(UUID aspirantId) {
        List<TopicProgress> rows = topicProgressRepository.findAllByAspirantId(aspirantId);
        if (rows.isEmpty()) return List.of();

        // Two aggregate queries total, instead of one revision query per topic (N+1).
        Map<UUID, Integer> revisionCounts = new HashMap<>();
        for (Object[] row : revisionRepository.countAllByAspirantId(aspirantId)) {
            revisionCounts.put((UUID) row[0], ((Long) row[1]).intValue());
        }
        Map<UUID, LocalDate> lastRevisionDates = new HashMap<>();
        for (Object[] row : revisionRepository.maxRevisionDateByAspirantId(aspirantId)) {
            lastRevisionDates.put((UUID) row[0], (LocalDate) row[1]);
        }

        return rows.stream()
                .map(tp -> new TopicProgressSummaryDto(
                        tp.getTopic().getId(),
                        tp.getStatus().name(),
                        tp.getConfidence(),
                        revisionCounts.getOrDefault(tp.getId(), 0),
                        lastRevisionDates.get(tp.getId())
                ))
                .toList();
    }

    @Transactional
    public TopicProgressDetailDto updateStatus(UUID topicId, UUID aspirantId, String rawStatus) {
        TopicProgress.Status newStatus = parseStatus(rawStatus);
        TopicProgress progress = getOrCreate(topicId, aspirantId);
        TopicProgress.Status currentStatus = progress.getStatus();

        if (currentStatus == newStatus) {
            return toDetailDto(progress);
        }

        // Data integrity (spec section 30): a revision cannot exist unless the
        // parent topic is completed, so moving a topic away from COMPLETED once
        // it has revisions would leave orphaned revisions. Block it outright
        // rather than silently cascading a delete.
        if (currentStatus == TopicProgress.Status.COMPLETED && newStatus != TopicProgress.Status.COMPLETED) {
            int revisionCount = revisionRepository.countByTopicProgressId(progress.getId());
            if (revisionCount > 0) {
                throw ApiException.conflict(
                        "This topic already has " + revisionCount + " revision(s) recorded. "
                                + "It can't be un-completed without first dealing with those revisions.");
            }
            // No revisions yet - safe to move backward. Completion state resets.
            progress.setCompletedAt(null);
            progress.setConfidence(null);
        }

        if (newStatus == TopicProgress.Status.COMPLETED && currentStatus != TopicProgress.Status.COMPLETED) {
            progress.setCompletedAt(Instant.now());
        }

        progress.setStatus(newStatus);
        return toDetailDto(topicProgressRepository.save(progress));
    }

    @Transactional
    public TopicProgressDetailDto updateConfidence(UUID topicId, UUID aspirantId, int confidence) {
        TopicProgress progress = getOrCreate(topicId, aspirantId);
        if (progress.getStatus() != TopicProgress.Status.COMPLETED) {
            throw ApiException.badRequest("Mark the topic completed before setting a confidence score.");
        }
        progress.setConfidence(confidence);
        return toDetailDto(topicProgressRepository.save(progress));
    }

    /** Used by RevisionService too - keeps the "must exist" + "must be completed" checks in one place. */
    TopicProgress requireCompleted(UUID topicId, UUID aspirantId) {
        TopicProgress progress = topicProgressRepository.findByTopicIdAndAspirantId(topicId, aspirantId)
                .orElseThrow(() -> ApiException.badRequest(
                        "Complete the topic first - revisions unlock after completion."));
        if (progress.getStatus() != TopicProgress.Status.COMPLETED) {
            throw ApiException.badRequest("Complete the topic first - revisions unlock after completion.");
        }
        return progress;
    }

    private TopicProgress getOrCreate(UUID topicId, UUID aspirantId) {
        return topicProgressRepository.findByTopicIdAndAspirantId(topicId, aspirantId)
                .orElseGet(() -> {
                    Topic topic = topicRepository.findById(topicId)
                            .orElseThrow(() -> ApiException.notFound("Topic"));
                    User aspirant = userRepository.findById(aspirantId)
                            .orElseThrow(() -> ApiException.notFound("Aspirant"));
                    TopicProgress fresh = new TopicProgress();
                    fresh.setTopic(topic);
                    fresh.setAspirant(aspirant);
                    fresh.setStatus(TopicProgress.Status.NOT_STARTED);
                    return topicProgressRepository.save(fresh);
                });
    }

    private TopicProgress.Status parseStatus(String raw) {
        try {
            return TopicProgress.Status.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.badRequest(
                    "Status must be one of NOT_STARTED, IN_PROGRESS, COMPLETED - got '" + raw + "'.");
        }
    }

    TopicProgressDetailDto toDetailDto(TopicProgress progress) {
        List<RevisionDto> revisionDtos = revisionRepository
                .findAllByTopicProgressIdOrderByRevisionNumber(progress.getId())
                .stream()
                .map(r -> new RevisionDto(
                        r.getId(), r.getRevisionNumber(), r.getRevisionDate(), r.getDurationMinutes(),
                        r.getConfidence(), r.getNotes(), r.getMentorNote(), r.getCreatedAt()))
                .toList();

        return new TopicProgressDetailDto(
                progress.getTopic().getId(),
                progress.getStatus().name(),
                progress.getConfidence(),
                progress.getCompletedAt(),
                revisionDtos
        );
    }
}
