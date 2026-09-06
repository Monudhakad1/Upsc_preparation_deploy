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
@Table(name = "questions")
@Getter
@Setter
public class Question {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aspirant_id", nullable = false)
    private User aspirant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id")
    private Paper paper;

    @Column(nullable = false, columnDefinition = "text")
    private String question;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    private Integer marks;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Difficulty difficulty;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    private LocalDate deadline;

    @Column(columnDefinition = "text")
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority = Priority.MEDIUM;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public enum Type {
        MAINS_ANSWER, MCQ, CSAT_MATHS, CSAT_REASONING, ESSAY, HISTORY_OPTIONAL, REVISION_TEST
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    public enum Priority {
        LOW, MEDIUM, HIGH
    }
}
