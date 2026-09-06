package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.QuestionSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionSubmissionRepository extends JpaRepository<QuestionSubmission, UUID> {

    /** Full entity including file bytes - only used by the attachment-download endpoint. */
    Optional<QuestionSubmission> findByQuestionId(UUID questionId);

    /**
     * Metadata only (no file_data) - selected as a raw projection so listing
     * many questions' submissions never pulls scanned-PDF bytes into memory
     * just to show "submitted" status.
     */
    @Query("select s.question.id, s.id, s.textAnswer, s.fileName, s.fileContentType, " +
           "s.mentorFeedback, s.reviewedByMentor, s.submittedAt " +
           "from QuestionSubmission s where s.question.aspirant.id = :aspirantId")
    List<Object[]> findSummariesByAspirantId(UUID aspirantId);
}
