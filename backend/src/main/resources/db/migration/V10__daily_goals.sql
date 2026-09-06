-- Phase 7: daily goals, including CSAT Maths/Reasoning practice sets (spec
-- section 18). One unified model covers both - a CSAT practice set is just a
-- goal with category=CSAT_MATHS/CSAT_REASONING and a target_count (e.g. "10
-- percentage questions"), same as any other quantifiable goal.

CREATE TABLE daily_goals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    aspirant_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title             VARCHAR(255) NOT NULL,
    category          VARCHAR(20) NOT NULL CHECK (category IN (
                          'SYLLABUS', 'REVISION', 'PYQ', 'ANSWER_WRITING',
                          'CSAT_MATHS', 'CSAT_REASONING', 'CURRENT_AFFAIRS', 'OTHER'
                      )),
    goal_date         DATE NOT NULL,
    priority          VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    description       TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
                          'PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIALLY_COMPLETED', 'SKIPPED'
                      )),
    -- Quantifiable goals (spec examples: "Percentage - 10 questions", "Solve 3
    -- PYQs") track a target/completed count; qualitative ones (e.g. "Revise
    -- Fundamental Rights") just use status and leave these null.
    target_count      INTEGER CHECK (target_count IS NULL OR target_count >= 0),
    completed_count   INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
    completed_at      TIMESTAMPTZ,
    mentor_note       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_goals_aspirant ON daily_goals(aspirant_id);
CREATE INDEX idx_daily_goals_date ON daily_goals(goal_date);
CREATE INDEX idx_daily_goals_status ON daily_goals(status);
