package com.upscmentor.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * The most important entity in the whole system (spec section 3). Every
 * later phase - revisions, PYQs, questions, current affairs, answer writing,
 * focus areas - links back to a topic_id. Its unique UUID is the anchor the
 * entire "where do I stand" dashboard hangs off of.
 */
@Entity
@Table(name = "topics")
@Getter
@Setter
public class Topic {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(nullable = false)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
