package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.question.AttachmentDto;
import com.upscmentor.backend.entity.Question;
import com.upscmentor.backend.entity.QuestionSubmission;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.QuestionRepository;
import com.upscmentor.backend.repository.QuestionSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuestionSubmissionService {

    private final QuestionRepository questionRepository;
    private final QuestionSubmissionRepository submissionRepository;

    /**
     * Submitting again replaces the previous attempt entirely (spec doesn't
     * ask for submission history/versioning) - this keeps "did I submit yet"
     * a simple yes/no per question rather than a growing list to manage.
     */
    @Transactional
    public void submit(UUID aspirantId, UUID questionId, String textAnswer, MultipartFile file) {
        Question question = questionRepository.findByIdAndAspirantId(questionId, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));

        boolean hasText = textAnswer != null && !textAnswer.isBlank();
        boolean hasFile = file != null && !file.isEmpty();
        if (!hasText && !hasFile) {
            throw ApiException.badRequest("Submit at least a text answer or a file (image/PDF).");
        }

        QuestionSubmission submission = submissionRepository.findByQuestionId(questionId)
                .orElseGet(() -> {
                    QuestionSubmission fresh = new QuestionSubmission();
                    fresh.setQuestion(question);
                    return fresh;
                });

        submission.setTextAnswer(hasText ? textAnswer : null);
        if (hasFile) {
            try {
                submission.setFileName(file.getOriginalFilename());
                submission.setFileContentType(file.getContentType());
                submission.setFileData(file.getBytes());
            } catch (IOException e) {
                throw ApiException.badRequest("Couldn't read the uploaded file.");
            }
        } else {
            submission.setFileName(null);
            submission.setFileContentType(null);
            submission.setFileData(null);
        }
        submission.setSubmittedAt(Instant.now());

        submissionRepository.save(submission);
    }

    @Transactional(readOnly = true)
    public AttachmentDto getAttachment(UUID aspirantId, UUID questionId) {
        questionRepository.findByIdAndAspirantId(questionId, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));
        QuestionSubmission submission = submissionRepository.findByQuestionId(questionId)
                .orElseThrow(() -> ApiException.notFound("Submission"));
        if (submission.getFileData() == null) {
            throw ApiException.notFound("Attachment");
        }
        return new AttachmentDto(submission.getFileName(), submission.getFileContentType(), submission.getFileData());
    }

    @Transactional
    public void updateFeedback(UUID aspirantId, UUID questionId, String mentorFeedback, boolean reviewedByMentor) {
        questionRepository.findByIdAndAspirantId(questionId, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));
        QuestionSubmission submission = submissionRepository.findByQuestionId(questionId)
                .orElseThrow(() -> ApiException.badRequest("Can't leave feedback before the aspirant has submitted."));
        submission.setMentorFeedback(mentorFeedback);
        submission.setReviewedByMentor(reviewedByMentor);
        submissionRepository.save(submission);
    }
}
