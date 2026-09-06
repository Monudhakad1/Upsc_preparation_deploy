package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "pyqs")
@Getter
@Setter
public class Pyq {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aspirant_id", nullable = false)
    private User aspirant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paper_id", nullable = false)
    private Paper paper;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false, columnDefinition = "text")
    private String question;

    private Integer marks;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_status", nullable = false, length = 20)
    private AttemptStatus attemptStatus = AttemptStatus.NOT_ATTEMPTED;

    @Column(name = "answer_quality")
    private Integer answerQuality;

    @Column(name = "analysis_notes", columnDefinition = "text")
    private String analysisNotes;

    @Column(name = "model_answer_reviewed", nullable = false)
    private boolean modelAnswerReviewed = false;

    @Column(nullable = false)
    private boolean reattempted = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "pyq_topics",
            joinColumns = @JoinColumn(name = "pyq_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    private Set<Topic> topics = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public enum AttemptStatus {
        NOT_ATTEMPTED, ATTEMPTED, SKIPPED
    }
}
