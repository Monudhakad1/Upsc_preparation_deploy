-- Phase 5: PYQ tracking (spec section 16). Scoped per aspirant like
-- topic_progress, since attempt status/quality/analysis are personal
-- tracking data, not shared syllabus structure.

CREATE TABLE pyqs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aspirant_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    paper_id                UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    year                    INTEGER NOT NULL CHECK (year BETWEEN 1990 AND 2100),
    question                TEXT NOT NULL,
    marks                   INTEGER CHECK (marks IS NULL OR marks >= 0),
    attempt_status          VARCHAR(20) NOT NULL DEFAULT 'NOT_ATTEMPTED'
                            CHECK (attempt_status IN ('NOT_ATTEMPTED', 'ATTEMPTED', 'SKIPPED')),
    answer_quality          SMALLINT CHECK (answer_quality BETWEEN 1 AND 5),
    analysis_notes          TEXT,
    model_answer_reviewed   BOOLEAN NOT NULL DEFAULT FALSE,
    reattempted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pyqs_aspirant ON pyqs(aspirant_id);
CREATE INDEX idx_pyqs_paper ON pyqs(paper_id);
CREATE INDEX idx_pyqs_year ON pyqs(year);
CREATE INDEX idx_pyqs_attempt_status ON pyqs(attempt_status);

-- "A PYQ can belong to one or multiple syllabus topics if necessary" (spec
-- section 30) - a real many-to-many, not a single nullable topic_id.
CREATE TABLE pyq_topics (
    pyq_id      UUID NOT NULL REFERENCES pyqs(id) ON DELETE CASCADE,
    topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    PRIMARY KEY (pyq_id, topic_id)
);

CREATE INDEX idx_pyq_topics_topic ON pyq_topics(topic_id);
