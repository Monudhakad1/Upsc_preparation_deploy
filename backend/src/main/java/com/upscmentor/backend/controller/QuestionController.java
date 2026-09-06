package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.question.AttachmentDto;
import com.upscmentor.backend.dto.question.MentorFeedbackRequest;
import com.upscmentor.backend.dto.question.QuestionDto;
import com.upscmentor.backend.dto.question.UpsertQuestionRequest;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.QuestionService;
import com.upscmentor.backend.service.QuestionSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * The mentor assigns work here ("Today's Questions" for the aspirant, spec
 * section 17); the aspirant submits an answer. Both roles can read; only
 * the mentor creates/edits/deletes questions and leaves feedback, only the
 * aspirant submits an answer to her own assigned question.
 */
@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionSubmissionService submissionService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping
    public List<QuestionDto> list(@AuthenticationPrincipal UserPrincipal principal) {
        return questionService.list(aspirantContextResolver.resolve(principal));
    }

    @GetMapping("/{id}")
    public QuestionDto get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return questionService.get(aspirantContextResolver.resolve(principal), id);
    }

    @PostMapping
    @PreAuthorize("hasRole('MENTOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionDto create(@Valid @RequestBody UpsertQuestionRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return questionService.create(principal.getId(), aspirantId, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MENTOR')")
    public QuestionDto update(
            @PathVariable UUID id,
            @Valid @RequestBody UpsertQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return questionService.update(aspirantContextResolver.resolve(principal), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MENTOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        questionService.delete(aspirantContextResolver.resolve(principal), id);
    }

    @PostMapping(value = "/{id}/submission", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ASPIRANT')")
    public QuestionDto submit(
            @PathVariable UUID id,
            @RequestParam(required = false) String textAnswer,
            @RequestParam(required = false) MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        submissionService.submit(aspirantId, id, textAnswer, file);
        return questionService.get(aspirantId, id);
    }

    @GetMapping("/{id}/submission/attachment")
    public ResponseEntity<byte[]> getAttachment(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        AttachmentDto attachment = submissionService.getAttachment(aspirantContextResolver.resolve(principal), id);
        MediaType mediaType = attachment.contentType() != null
                ? MediaType.parseMediaType(attachment.contentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.fileName() + "\"")
                .body(attachment.data());
    }

    @PutMapping("/{id}/submission/feedback")
    @PreAuthorize("hasRole('MENTOR')")
    public QuestionDto updateFeedback(
            @PathVariable UUID id,
            @RequestBody MentorFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        submissionService.updateFeedback(aspirantId, id, request.mentorFeedback(), request.reviewedByMentor());
        return questionService.get(aspirantId, id);
    }
}
