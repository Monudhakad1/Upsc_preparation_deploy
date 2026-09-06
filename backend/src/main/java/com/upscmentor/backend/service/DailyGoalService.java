package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.goal.DailyGoalDto;
import com.upscmentor.backend.dto.goal.UpdateGoalProgressRequest;
import com.upscmentor.backend.dto.goal.UpsertGoalRequest;
import com.upscmentor.backend.entity.DailyGoal;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.DailyGoalRepository;
import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyGoalService {

    private final DailyGoalRepository goalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DailyGoalDto> list(UUID aspirantId) {
        return goalRepository.findAllByAspirantIdOrderByGoalDateDescCreatedAtDesc(aspirantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public DailyGoalDto create(UUID mentorId, UUID aspirantId, UpsertGoalRequest request) {
        User mentor = userRepository.findById(mentorId).orElseThrow(() -> ApiException.notFound("Mentor"));
        User aspirant = userRepository.findById(aspirantId).orElseThrow(() -> ApiException.notFound("Aspirant"));

        DailyGoal goal = new DailyGoal();
        goal.setMentor(mentor);
        goal.setAspirant(aspirant);
        applyUpsert(goal, request);

        return toDto(goalRepository.save(goal));
    }

    @Transactional
    public DailyGoalDto update(UUID aspirantId, UUID id, UpsertGoalRequest request) {
        DailyGoal goal = goalRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Goal"));
        applyUpsert(goal, request);
        return toDto(goalRepository.save(goal));
    }

    /**
     * The aspirant's side: move status forward and, for quantifiable goals,
     * log how many she's actually done. completedCount is clamped to
     * targetCount rather than rejected outright - if she does 11 of a
     * 10-question set by accident, that shouldn't be an error.
     */
    @Transactional
    public DailyGoalDto updateProgress(UUID aspirantId, UUID id, UpdateGoalProgressRequest request) {
        DailyGoal goal = goalRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Goal"));

        DailyGoal.Status newStatus = parseEnum(DailyGoal.Status.class, request.status(), "status");
        DailyGoal.Status previousStatus = goal.getStatus();

        if (request.completedCount() != null) {
            int clamped = goal.getTargetCount() != null
                    ? Math.min(request.completedCount(), goal.getTargetCount())
                    : request.completedCount();
            goal.setCompletedCount(clamped);
        }

        goal.setStatus(newStatus);
        if (newStatus == DailyGoal.Status.COMPLETED && previousStatus != DailyGoal.Status.COMPLETED) {
            goal.setCompletedAt(Instant.now());
        } else if (newStatus != DailyGoal.Status.COMPLETED) {
            goal.setCompletedAt(null);
        }

        return toDto(goalRepository.save(goal));
    }

    @Transactional
    public void delete(UUID aspirantId, UUID id) {
        DailyGoal goal = goalRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Goal"));
        goalRepository.delete(goal);
    }

    private void applyUpsert(DailyGoal goal, UpsertGoalRequest request) {
        goal.setTitle(request.title());
        goal.setCategory(parseEnum(DailyGoal.Category.class, request.category(), "category"));
        goal.setGoalDate(request.goalDate());
        goal.setPriority(request.priority() == null ? DailyGoal.Priority.MEDIUM
                : parseEnum(DailyGoal.Priority.class, request.priority(), "priority"));
        goal.setDescription(request.description());
        goal.setTargetCount(request.targetCount());
        goal.setMentorNote(request.mentorNote());
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String raw, String fieldName) {
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid " + fieldName + ": '" + raw + "'.");
        }
    }

    private DailyGoalDto toDto(DailyGoal g) {
        return new DailyGoalDto(
                g.getId(), g.getTitle(), g.getCategory().name(), g.getGoalDate(), g.getPriority().name(),
                g.getDescription(), g.getStatus().name(), g.getTargetCount(), g.getCompletedCount(),
                g.getCompletedAt(), g.getMentorNote(), g.getCreatedAt()
        );
    }
}
