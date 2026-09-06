-- Phase 6: mentor question assignment + aspirant submissions (spec section 17).
-- Files (scanned handwritten answers, etc.) are stored directly in Postgres as
-- bytea rather than needing S3/blob storage wired up - fine at this scale for a
-- private single-aspirant app, and keeps the whole system self-contained.

CREATE TABLE questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    aspirant_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    topic_id            UUID REFERENCES topics(id) ON DELETE RESTRICT,
    paper_id            UUID REFERENCES papers(id) ON DELETE RESTRICT,
    question            TEXT NOT NULL,
    type                VARCHAR(30) NOT NULL CHECK (type IN (
                            'MAINS_ANSWER', 'MCQ', 'CSAT_MATHS', 'CSAT_REASONING',
                            'ESSAY', 'HISTORY_OPTIONAL', 'REVISION_TEST'
                        )),
    marks               INTEGER CHECK (marks IS NULL OR marks >= 0),
    difficulty          VARCHAR(10) CHECK (difficulty IS NULL OR difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    time_limit_minutes  INTEGER CHECK (time_limit_minutes IS NULL OR time_limit_minutes >= 0),
    deadline            DATE,
    instructions        TEXT,
    priority            VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_aspirant ON questions(aspirant_id);
CREATE INDEX idx_questions_deadline ON questions(deadline);
CREATE INDEX idx_questions_topic ON questions(topic_id);

-- One submission per question (a fresh submit replaces the previous one -
-- see QuestionSubmissionService). Must have text and/or a file: spec section
-- 17 says the aspirant submits "text answer, image, or PDF" - at least one.
CREATE TABLE question_submissions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id          UUID NOT NULL UNIQUE REFERENCES questions(id) ON DELETE RESTRICT,
    text_answer          TEXT,
    file_name            VARCHAR(255),
    file_content_type    VARCHAR(100),
    file_data            BYTEA,
    mentor_feedback      TEXT,
    reviewed_by_mentor   BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (text_answer IS NOT NULL OR file_data IS NOT NULL)
);

CREATE INDEX idx_submissions_question ON question_submissions(question_id);
