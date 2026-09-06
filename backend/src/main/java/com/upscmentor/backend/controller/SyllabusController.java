package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.progress.TopicProgressSummaryDto;
import com.upscmentor.backend.dto.syllabus.PaperDto;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.SyllabusService;
import com.upscmentor.backend.service.TopicProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only for now: both mentor and aspirant can view the full syllabus
 * tree. Writes (marking a topic complete, adding a revision, etc.) live in
 * TopicProgressController - this endpoint only serves the static structure
 * seeded in V3__seed_syllabus.sql.
 */
@RestController
@RequestMapping("/api/syllabus")
@RequiredArgsConstructor
public class SyllabusController {

    private final SyllabusService syllabusService;
    private final TopicProgressService topicProgressService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping
    public List<PaperDto> getFullTree() {
        return syllabusService.getFullTree();
    }

    /** One call to color every topic's status dot, instead of 469 individual GETs. */
    @GetMapping("/progress")
    public List<TopicProgressSummaryDto> getProgressSummary(@AuthenticationPrincipal UserPrincipal principal) {
        return topicProgressService.getAllSummaries(aspirantContextResolver.resolve(principal));
    }
}
