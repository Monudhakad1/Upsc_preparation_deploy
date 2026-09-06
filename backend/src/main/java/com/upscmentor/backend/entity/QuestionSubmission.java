package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "question_submissions")
@Getter
@Setter
public class QuestionSubmission {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private Question question;

    @Column(name = "text_answer", columnDefinition = "text")
    private String textAnswer;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_content_type")
    private String fileContentType;

    @Column(name = "file_data")
    private byte[] fileData;

    @Column(name = "mentor_feedback", columnDefinition = "text")
    private String mentorFeedback;

    @Column(name = "reviewed_by_mentor", nullable = false)
    private boolean reviewedByMentor = false;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
