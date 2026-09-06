package com.upscmentor.backend.entity;

/**
 * Only two roles exist in v1 (one mentor, one aspirant - see spec section 2).
 * Kept as an enum (not a DB-driven table) for now since the role set is fixed,
 * but the User -> aspirant/mentor link is modeled so a real multi-user
 * version (roles table, many aspirants per mentor) can be introduced later
 * without reshaping this entity.
 */
public enum Role {
    MENTOR,
    ASPIRANT
}
