package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * A real revision record (spec section 13), not just a number. revisionNumber
 * is assigned sequentially by RevisionService (1, 2, 3, ... - never reused,
 * no upper limit per spec section 36).
 */
@Entity
@Table(name = "revisions")
@Getter
@Setter
public class Revision {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_progress_id", nullable = false)
    private TopicProgress topicProgress;

    @Column(name = "revision_number", nullable = false)
    private int revisionNumber;

    @Column(name = "revision_date", nullable = false)
    private LocalDate revisionDate;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    private Integer confidence;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "mentor_note", columnDefinition = "text")
    private String mentorNote;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
