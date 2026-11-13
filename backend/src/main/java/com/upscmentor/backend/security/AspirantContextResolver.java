package com.upscmentor.backend.security;

import com.upscmentor.backend.entity.Role;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Every read/write in the app is scoped to "one aspirant's preparation data".
 * This is the single place that decides whose data a request resolves to:
 * <ul>
 *   <li>An ASPIRANT always gets their own data - nothing they send can change that.</li>
 *   <li>A MENTOR acts as admin over all aspirants and picks one with the
 *       {@code X-Aspirant-Id} header (falls back to the legacy linked aspirant).</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class AspirantContextResolver {

    public static final String HEADER = "X-Aspirant-Id";
    private static final long TTL_MS = 60_000;

    private final UserRepository userRepository;
    // Confirmed aspirant ids -> time checked, so switching aspirants doesn't add a DB trip to every call.
    private final Map<UUID, Long> knownAspirants = new ConcurrentHashMap<>();

    public UUID resolve(UserPrincipal principal) {
        User user = principal.getUser();
        if (user.getRole() == Role.ASPIRANT) {
            return user.getId();
        }

        UUID requested = requestedAspirantId();
        if (requested != null) {
            requireAspirant(requested);
            return requested;
        }
        if (user.getLinkedAspirantId() != null) {
            return user.getLinkedAspirantId();
        }
        throw new ApiException(HttpStatus.CONFLICT, "Select an aspirant to view.");
    }

    /** Drop cached checks (e.g. after an account is deleted or its role changes). */
    public void forget(UUID aspirantId) {
        knownAspirants.remove(aspirantId);
    }

    private void requireAspirant(UUID id) {
        long now = System.currentTimeMillis();
        Long checkedAt = knownAspirants.get(id);
        if (checkedAt != null && now - checkedAt < TTL_MS) {
            return;
        }
        if (!userRepository.existsByIdAndRole(id, Role.ASPIRANT)) {
            throw ApiException.notFound("Aspirant");
        }
        knownAspirants.put(id, now);
    }

    private static UUID requestedAspirantId() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        String raw = attrs.getRequest().getHeader(HEADER);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid " + HEADER + " header.");
        }
    }
}
