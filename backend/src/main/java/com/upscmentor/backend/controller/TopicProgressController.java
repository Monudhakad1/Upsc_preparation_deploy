package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.progress.AddRevisionRequest;
import com.upscmentor.backend.dto.progress.TopicProgressDetailDto;
import com.upscmentor.backend.dto.progress.UpdateConfidenceRequest;
import com.upscmentor.backend.dto.progress.UpdateStatusRequest;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.RevisionService;
import com.upscmentor.backend.service.TopicProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * GET endpoints work for both roles (mentor sees their linked aspirant's
 * data, read-only). Writes are aspirant-only: the aspirant marks her own
 * topics complete and logs her own revisions (spec sections 2 and 33) - the
 * mentor's role here is to view, assign, and note, not to edit her progress
 * directly.
 */
@RestController
@RequestMapping("/api/topics/{topicId}")
@RequiredArgsConstructor
public class TopicProgressController {

    private final TopicProgressService topicProgressService;
    private final RevisionService revisionService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping("/progress")
    public TopicProgressDetailDto getProgress(
            @PathVariable UUID topicId,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return topicProgressService.getDetail(topicId, aspirantId);
    }

    @PutMapping("/progress/status")
    @PreAuthorize("hasRole('ASPIRANT')")
    public TopicProgressDetailDto updateStatus(
            @PathVariable UUID topicId,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return topicProgressService.updateStatus(topicId, aspirantId, request.status());
    }

    @PutMapping("/progress/confidence")
    @PreAuthorize("hasRole('ASPIRANT')")
    public TopicProgressDetailDto updateConfidence(
            @PathVariable UUID topicId,
            @Valid @RequestBody UpdateConfidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return topicProgressService.updateConfidence(topicId, aspirantId, request.confidence());
    }

    @PostMapping("/revisions")
    @PreAuthorize("hasRole('ASPIRANT')")
    public TopicProgressDetailDto addRevision(
            @PathVariable UUID topicId,
            @Valid @RequestBody AddRevisionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return revisionService.addRevision(topicId, aspirantId, request);
    }
}
