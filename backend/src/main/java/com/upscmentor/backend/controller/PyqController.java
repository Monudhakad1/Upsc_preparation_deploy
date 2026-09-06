package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.pyq.CreatePyqRequest;
import com.upscmentor.backend.dto.pyq.PyqDto;
import com.upscmentor.backend.dto.pyq.UpdatePyqRequest;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.PyqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pyqs")
@RequiredArgsConstructor
public class PyqController {

    private final PyqService pyqService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping
    public List<PyqDto> list(
            @RequestParam(required = false) UUID paperId,
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) String attemptStatus,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID aspirantId = aspirantContextResolver.resolve(principal);
        return pyqService.list(aspirantId, paperId, topicId, attemptStatus);
    }

    @GetMapping("/{id}")
    public PyqDto get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return pyqService.get(aspirantContextResolver.resolve(principal), id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ASPIRANT')")
    @ResponseStatus(HttpStatus.CREATED)
    public PyqDto create(@Valid @RequestBody CreatePyqRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return pyqService.create(aspirantContextResolver.resolve(principal), request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ASPIRANT')")
    public PyqDto update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePyqRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return pyqService.update(aspirantContextResolver.resolve(principal), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ASPIRANT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        pyqService.delete(aspirantContextResolver.resolve(principal), id);
    }
}
