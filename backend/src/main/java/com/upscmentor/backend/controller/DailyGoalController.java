package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.goal.DailyGoalDto;
import com.upscmentor.backend.dto.goal.UpdateGoalProgressRequest;
import com.upscmentor.backend.dto.goal.UpsertGoalRequest;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.DailyGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class DailyGoalController {

    private final DailyGoalService goalService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping
    public List<DailyGoalDto> list(@AuthenticationPrincipal UserPrincipal principal) {
        return goalService.list(aspirantContextResolver.resolve(principal));
    }

    @PostMapping
    @PreAuthorize("hasRole('MENTOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public DailyGoalDto create(@Valid @RequestBody UpsertGoalRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return goalService.create(principal.getId(), aspirantId, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MENTOR')")
    public DailyGoalDto update(
            @PathVariable UUID id,
            @Valid @RequestBody UpsertGoalRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return goalService.update(aspirantContextResolver.resolve(principal), id, request);
    }

    @PutMapping("/{id}/progress")
    @PreAuthorize("hasRole('ASPIRANT')")
    public DailyGoalDto updateProgress(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGoalProgressRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return goalService.updateProgress(aspirantContextResolver.resolve(principal), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MENTOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        goalService.delete(aspirantContextResolver.resolve(principal), id);
    }
}
