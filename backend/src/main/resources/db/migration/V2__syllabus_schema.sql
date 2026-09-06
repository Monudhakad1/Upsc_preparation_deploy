-- Phase 2: the core entity of the whole app (spec section 3).
-- SUBJECT/PAPER -> AREA -> TOPIC -> SUBTOPIC. Every other module (revisions,
-- PYQs, questions, current affairs, ...) links to a topic_id (or, rarely,
-- subtopic_id) added in later phases - nothing here references them yet.

CREATE TABLE papers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(30)  NOT NULL UNIQUE,   -- e.g. 'GS1', 'CSAT', 'HIST_OPT_1'
    name           VARCHAR(255) NOT NULL,
    exam_stage     VARCHAR(20)  NOT NULL CHECK (exam_stage IN ('PRELIMS', 'MAINS', 'OPTIONAL', 'ESSAY')),
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE areas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id       UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    name           VARCHAR(255) NOT NULL,
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (paper_id, name)
);

CREATE TABLE topics (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id        UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name           VARCHAR(255) NOT NULL,
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (area_id, name)
);

CREATE TABLE subtopics (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id       UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    name           VARCHAR(255) NOT NULL,
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (topic_id, name)
);

-- ON DELETE RESTRICT everywhere in this tree deliberately: spec section 30
-- says never let a topic disappear (and silently orphan revisions/PYQs/etc.
-- added in later phases) without an explicit, confirmed action. Deleting a
-- topic with children must fail loudly, not cascade quietly.

CREATE INDEX idx_areas_paper_id ON areas(paper_id);
CREATE INDEX idx_topics_area_id ON topics(area_id);
CREATE INDEX idx_subtopics_topic_id ON subtopics(topic_id);
