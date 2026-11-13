package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.LoginRequest;
import com.upscmentor.backend.dto.LoginResponse;
import com.upscmentor.backend.dto.RegisterRequest;
import com.upscmentor.backend.dto.UserDto;
import com.upscmentor.backend.security.AuthRateLimiter;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final long FIFTEEN_MIN = 15 * 60_000L;
    private static final long ONE_HOUR = 60 * 60_000L;

    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String key = "login:" + request.email().trim().toLowerCase(Locale.ROOT);
        rateLimiter.check(key, 10, FIFTEEN_MIN);
        rateLimiter.check("login-ip:" + clientIp(http), 50, FIFTEEN_MIN);
        LoginResponse response = authService.login(request);
        rateLimiter.reset(key); // a successful sign-in clears this account's failed attempts
        return response;
    }

    /** Public sign-up for aspirants. Returns a token so the user is signed in straight away. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public LoginResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        rateLimiter.check("register:" + clientIp(http), 20, ONE_HOUR); // allows a shared coaching-centre wifi
        return authService.register(request);
    }

    /** Lets the frontend restore a session on page load / refresh from a stored token. */
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal UserPrincipal principal) {
        return UserDto.from(principal.getUser());
    }

    /** Render sits behind a proxy, so the real client is the first X-Forwarded-For hop. */
    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
