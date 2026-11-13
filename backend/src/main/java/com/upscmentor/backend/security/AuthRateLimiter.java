package com.upscmentor.backend.security;

import com.upscmentor.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tiny in-memory fixed-window limiter for the public endpoints (login and
 * sign-up), so nobody can brute-force passwords or mass-create accounts.
 * The app runs as a single instance, so memory is the right place for it.
 */
@Component
public class AuthRateLimiter {

    private record Window(long startedAt, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /** Counts one attempt for {@code key}; throws 429 once {@code max} is exceeded within {@code windowMs}. */
    public void check(String key, int max, long windowMs) {
        long now = System.currentTimeMillis();
        Window w = windows.compute(key, (k, old) ->
                old == null || now - old.startedAt() > windowMs
                        ? new Window(now, 1)
                        : new Window(old.startedAt(), old.count() + 1));
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().startedAt() > windowMs);
        }
        if (w.count() > max) {
            long waitMin = Math.max(1, (windowMs - (now - w.startedAt())) / 60_000);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many attempts. Try again in " + waitMin + " min.");
        }
    }

    public void reset(String key) {
        windows.remove(key);
    }
}
