package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_goals")
@Getter
@Setter
public class DailyGoal {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aspirant_id", nullable = false)
    private User aspirant;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(name = "goal_date", nullable = false)
    private LocalDate goalDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority = Priority.MEDIUM;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    /** Only set for quantifiable goals, e.g. "10 percentage questions" (spec section 18). */
    @Column(name = "target_count")
    private Integer targetCount;

    @Column(name = "completed_count", nullable = false)
    private int completedCount = 0;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "mentor_note", columnDefinition = "text")
    private String mentorNote;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public enum Category {
        SYLLABUS, REVISION, PYQ, ANSWER_WRITING, CSAT_MATHS, CSAT_REASONING, CURRENT_AFFAIRS, OTHER
    }

    public enum Priority {
        LOW, MEDIUM, HIGH
    }

    public enum Status {
        PENDING, IN_PROGRESS, COMPLETED, PARTIALLY_COMPLETED, SKIPPED
    }
}
