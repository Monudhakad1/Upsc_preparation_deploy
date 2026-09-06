package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.dashboard.*;
import com.upscmentor.backend.dto.goal.GoalStatsDto;
import com.upscmentor.backend.entity.TopicProgress;
import com.upscmentor.backend.repository.DailyGoalRepository;
import com.upscmentor.backend.repository.PyqRepository;
import com.upscmentor.backend.repository.RevisionRepository;
import com.upscmentor.backend.repository.TopicProgressRepository;
import com.upscmentor.backend.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TopicRepository topicRepository;
    private final TopicProgressRepository topicProgressRepository;
    private final RevisionRepository revisionRepository;
    private final PyqRepository pyqRepository;
    private final DailyGoalRepository dailyGoalRepository;

    // --- Overview: syllabus coverage + revision depth + per-subject progress ---

    @Transactional(readOnly = true)
    public DashboardOverviewDto getOverview(UUID aspirantId) {
        long totalTopics = topicRepository.count();
        long completedTopics = topicProgressRepository.countByAspirantIdAndStatus(
                aspirantId, TopicProgress.Status.COMPLETED);

        double syllabusCoverage = percent(completedTopics, totalTopics);

        RevisionDepthDto revisionDepth = computeRevisionDepth(aspirantId, completedTopics);
        List<SubjectProgressDto> subjects = computeSubjectProgress(aspirantId);

        return new DashboardOverviewDto(
                (int) totalTopics, (int) completedTopics, syllabusCoverage, revisionDepth, subjects);
    }

    private RevisionDepthDto computeRevisionDepth(UUID aspirantId, long completedTopics) {
        if (completedTopics == 0) {
            return new RevisionDepthDto(0, 0, 0, 0, 0, 0);
        }

        // Every topic_progress that ever gets a revision is guaranteed COMPLETED -
        // TopicProgressService blocks un-completing a topic that has revisions.
        // So it's safe to treat "not in this map" as "0 revisions" without an
        // extra query to check each one's current status.
        Map<UUID, Long> revisionCounts = revisionRepository.countAllByAspirantId(aspirantId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        long sum = 0;
        long atLeast1 = 0, atLeast2 = 0, atLeast3 = 0, atLeast4 = 0, atLeast5 = 0;
        for (long count : revisionCounts.values()) {
            sum += count;
            if (count >= 1) atLeast1++;
            if (count >= 2) atLeast2++;
            if (count >= 3) atLeast3++;
            if (count >= 4) atLeast4++;
            if (count >= 5) atLeast5++;
        }

        return new RevisionDepthDto(
                percent(atLeast1, completedTopics),
                percent(atLeast2, completedTopics),
                percent(atLeast3, completedTopics),
                percent(atLeast4, completedTopics),
                percent(atLeast5, completedTopics),
                round1(sum / (double) completedTopics)
        );
    }

    private List<SubjectProgressDto> computeSubjectProgress(UUID aspirantId) {
        // paperId -> [code, name, displayOrder, totalTopics]
        record PaperTotals(String code, String name, int displayOrder, long total) {}
        Map<UUID, PaperTotals> totals = new LinkedHashMap<>();
        for (Object[] row : topicRepository.countTopicsPerPaper()) {
            totals.put((UUID) row[0], new PaperTotals((String) row[1], (String) row[2], (int) row[3], (Long) row[4]));
        }

        Map<UUID, Long> completedByPaper = topicProgressRepository.countCompletedTopicsPerPaper(aspirantId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        return totals.entrySet().stream()
                .sorted(Comparator.comparingInt(e -> e.getValue().displayOrder()))
                .map(e -> {
                    long completed = completedByPaper.getOrDefault(e.getKey(), 0L);
                    return new SubjectProgressDto(
                            e.getKey(), e.getValue().code(), e.getValue().name(),
                            (int) e.getValue().total(), (int) completed,
                            percent(completed, e.getValue().total()));
                })
                .toList();
    }

    // --- Revision priority engine (spec section 14) ---

    @Transactional(readOnly = true)
    public PriorityListsDto getPriorities(UUID aspirantId) {
        List<TopicProgress> completed = topicProgressRepository.findCompletedWithHierarchyByAspirantId(aspirantId);

        Map<UUID, Long> revisionCounts = revisionRepository.countAllByAspirantId(aspirantId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        Map<UUID, LocalDate> lastRevisionDates = revisionRepository.maxRevisionDateByAspirantId(aspirantId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (LocalDate) row[1]));

        List<PriorityTopicDto> critical = new ArrayList<>();
        List<PriorityTopicDto> high = new ArrayList<>();
        List<PriorityTopicDto> medium = new ArrayList<>();
        List<PriorityTopicDto> wellRevised = new ArrayList<>();
        List<PriorityTopicDto> lowConfidence = new ArrayList<>();

        for (TopicProgress tp : completed) {
            long revisionCount = revisionCounts.getOrDefault(tp.getId(), 0L);
            PriorityTopicDto dto = new PriorityTopicDto(
                    tp.getTopic().getId(),
                    tp.getTopic().getName(),
                    tp.getTopic().getArea().getName(),
                    tp.getTopic().getArea().getPaper().getCode(),
                    tp.getConfidence(),
                    (int) revisionCount,
                    tp.getCompletedAt(),
                    lastRevisionDates.get(tp.getId())
            );

            if (revisionCount == 0) critical.add(dto);
            else if (revisionCount == 1) high.add(dto);
            else if (revisionCount <= 4) medium.add(dto);
            else wellRevised.add(dto);

            // Cross-cutting: low confidence surfaces here regardless of which
            // bucket above it landed in (spec section 15's "5 revisions but
            // confidence 2 is still weak" example).
            if (tp.getConfidence() != null && tp.getConfidence() <= 2) {
                lowConfidence.add(dto);
            }
        }

        // Oldest completion first within each bucket - the longer something has
        // sat completed-but-neglected, the more it deserves attention now.
        Comparator<PriorityTopicDto> oldestFirst = Comparator.comparing(
                PriorityTopicDto::completedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        critical.sort(oldestFirst);
        high.sort(oldestFirst);
        medium.sort(oldestFirst);
        wellRevised.sort(oldestFirst);
        lowConfidence.sort(Comparator.comparing(
                PriorityTopicDto::confidence, Comparator.nullsLast(Comparator.naturalOrder())));

        return new PriorityListsDto(critical, high, medium, wellRevised, lowConfidence);
    }

    private static double percent(long numerator, long denominator) {
        if (denominator == 0) return 0;
        return round1(numerator * 100.0 / denominator);
    }

    private static double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }

    // --- PYQ coverage by subject (spec section 16) ---

    @Transactional(readOnly = true)
    public List<PyqCoverageDto> getPyqCoverage(UUID aspirantId) {
        List<PyqCoverageDto> result = new ArrayList<>();
        for (Object[] row : pyqRepository.countCoveragePerPaper(aspirantId)) {
            UUID paperId = (UUID) row[0];
            String code = (String) row[1];
            String name = (String) row[2];
            long total = (Long) row[4];
            long attempted = row[5] != null ? (Long) row[5] : 0L;
            result.add(new PyqCoverageDto(paperId, code, name, (int) total, (int) attempted, percent(attempted, total)));
        }
        return result;
    }

    // --- Goal completion stats: today / this week / this month (spec section 18) ---

    @Transactional(readOnly = true)
    public GoalStatsDto getGoalStats(UUID aspirantId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate monthEnd = today.with(TemporalAdjusters.lastDayOfMonth());

        return new GoalStatsDto(
                (int) dailyGoalRepository.countCompletedInRange(aspirantId, today, today),
                (int) dailyGoalRepository.countByAspirantIdAndGoalDateBetween(aspirantId, today, today),
                (int) dailyGoalRepository.countCompletedInRange(aspirantId, weekStart, weekEnd),
                (int) dailyGoalRepository.countByAspirantIdAndGoalDateBetween(aspirantId, weekStart, weekEnd),
                (int) dailyGoalRepository.countCompletedInRange(aspirantId, monthStart, monthEnd),
                (int) dailyGoalRepository.countByAspirantIdAndGoalDateBetween(aspirantId, monthStart, monthEnd)
        );
    }
}
