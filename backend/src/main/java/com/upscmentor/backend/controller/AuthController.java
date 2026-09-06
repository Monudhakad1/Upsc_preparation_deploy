package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.LoginRequest;
import com.upscmentor.backend.dto.LoginResponse;
import com.upscmentor.backend.dto.UserDto;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Lets the frontend restore a session on page load / refresh from a stored token. */
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal UserPrincipal principal) {
        return UserDto.from(principal.getUser());
    }
}
