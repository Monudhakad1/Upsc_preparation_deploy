-- Phase 1: users table only. Every later phase adds its own Vn__*.sql file here
-- instead of editing this one, so migration history stays honest.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    display_name        VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    role                VARCHAR(20)  NOT NULL CHECK (role IN ('MENTOR', 'ASPIRANT')),
    linked_aspirant_id  UUID REFERENCES users(id),
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
