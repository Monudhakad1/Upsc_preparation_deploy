-- Phase 3: topic completion status + the revision system (spec sections 12-15).
-- One topic_progress row per (topic, aspirant) - scoped by aspirant even though
-- there's only one aspirant today, so a future multi-aspirant version doesn't
-- need a schema change here, only a new unique aspirant_id value.

CREATE TABLE topic_progress (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id      UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    aspirant_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status        VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
                  CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    -- Current/latest confidence for this topic (spec section 15). Only meaningful
    -- once status = COMPLETED; enforced in the service layer, not here, since a
    -- CHECK constraint can't easily reference another column's *transition* history.
    confidence    SMALLINT CHECK (confidence BETWEEN 1 AND 5),
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (topic_id, aspirant_id)
);

CREATE INDEX idx_topic_progress_aspirant ON topic_progress(aspirant_id);
CREATE INDEX idx_topic_progress_status ON topic_progress(status);

-- Real revision records, not just a counter (spec section 13). revision_number
-- is assigned sequentially by the service (1, 2, 3, ... with no upper limit -
-- section 36), never reused, so it always reflects true revision depth.
CREATE TABLE revisions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_progress_id  UUID NOT NULL REFERENCES topic_progress(id) ON DELETE RESTRICT,
    revision_number    INTEGER NOT NULL CHECK (revision_number >= 1),
    revision_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes   INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    confidence         SMALLINT CHECK (confidence BETWEEN 1 AND 5),
    notes              TEXT,
    mentor_note        TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (topic_progress_id, revision_number)
);

CREATE INDEX idx_revisions_topic_progress ON revisions(topic_progress_id);
