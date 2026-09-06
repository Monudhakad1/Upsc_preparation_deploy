package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "papers")
@Getter
@Setter
public class Paper {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_stage", nullable = false, length = 20)
    private ExamStage examStage;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public enum ExamStage {
        PRELIMS, MAINS, OPTIONAL, ESSAY
    }
}
