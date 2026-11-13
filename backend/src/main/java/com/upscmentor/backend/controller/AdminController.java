package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.admin.AdminUserDto;
import com.upscmentor.backend.dto.admin.CreateUserRequest;
import com.upscmentor.backend.dto.admin.UpdateActiveRequest;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.UserRepository;
import com.upscmentor.backend.security.UserDetailsServiceImpl;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Mentor = admin. Mentors see every account, create accounts (including new
 * mentor accounts - the only way a mentor can be created) and can deactivate
 * an account so it can no longer sign in.
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('MENTOR')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final UserDetailsServiceImpl userDetailsService;

    @GetMapping
    @Transactional(readOnly = true)
    public List<AdminUserDto> list() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminUserDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserDto create(@Valid @RequestBody CreateUserRequest request) {
        User user = authService.createUser(request.displayName(), request.email(), request.password(), request.role());
        return AdminUserDto.from(user);
    }

    @PatchMapping("/{id}/active")
    @Transactional
    public AdminUserDto setActive(
            @PathVariable UUID id,
            @RequestBody UpdateActiveRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (id.equals(principal.getId())) {
            throw ApiException.badRequest("You can't deactivate your own account.");
        }
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        user.setActive(request.active());
        userDetailsService.evict(user.getEmail()); // takes effect on their very next request
        return AdminUserDto.from(userRepository.save(user));
    }
}
