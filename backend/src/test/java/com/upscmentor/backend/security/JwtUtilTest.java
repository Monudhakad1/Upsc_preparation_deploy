package com.upscmentor.backend.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    // 48+ char dummy secret, well over the 32-byte HS256 minimum.
    private final JwtUtil jwtUtil = new JwtUtil(
            "this-is-a-test-secret-that-is-definitely-long-enough-for-hs256",
            1000L * 60 * 60 // 1 hour
    );

    @Test
    void generatedTokenIsValidAndRoundTripsClaims() {
        UUID userId = UUID.randomUUID();
        String token = jwtUtil.generateToken(userId, "aspirant@example.com", "ASPIRANT");

        assertThat(jwtUtil.isTokenValid(token)).isTrue();
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(userId);
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("aspirant@example.com");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ASPIRANT");
    }

    @Test
    void expiredTokenIsInvalid() {
        JwtUtil shortLived = new JwtUtil(
                "this-is-a-test-secret-that-is-definitely-long-enough-for-hs256",
                -1000L // already expired
        );
        String token = shortLived.generateToken(UUID.randomUUID(), "x@example.com", "MENTOR");

        assertThat(shortLived.isTokenValid(token)).isFalse();
    }

    @Test
    void constructorRejectsShortSecret() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> new JwtUtil("too-short", 1000L));
    }
}
