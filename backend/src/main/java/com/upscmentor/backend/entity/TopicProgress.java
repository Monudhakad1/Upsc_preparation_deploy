package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "topic_progress")
@Getter
@Setter
public class TopicProgress {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aspirant_id", nullable = false)
    private User aspirant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.NOT_STARTED;

    /** Only meaningful once status = COMPLETED - enforced in TopicProgressService. */
    @Column
    private Integer confidence;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public enum Status {
        NOT_STARTED, IN_PROGRESS, COMPLETED
    }
}
