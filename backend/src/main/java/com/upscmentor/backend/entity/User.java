package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String displayName;

    /** BCrypt hash only - never store or expose raw passwords. */
    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /**
     * For an ASPIRANT, this is null (she IS the preparation owner).
     * For a MENTOR, this points at the single aspirant they are linked to.
     * This is how "mentor can only access the linked aspirant" (spec section 33)
     * is enforced, and it's the seam that lets a future version support
     * multiple aspirants per mentor without renaming anything.
     */
    @Column(name = "linked_aspirant_id")
    private UUID linkedAspirantId;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
