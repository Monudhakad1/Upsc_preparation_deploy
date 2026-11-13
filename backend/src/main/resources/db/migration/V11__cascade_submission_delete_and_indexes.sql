-- Deleting a question (mentor action) must also delete its submission; the
-- original RESTRICT made that fail with a FK violation once an answer existed.
ALTER TABLE question_submissions DROP CONSTRAINT IF EXISTS question_submissions_question_id_fkey;
ALTER TABLE question_submissions
    ADD CONSTRAINT question_submissions_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- question_id is already UNIQUE (which creates its own index), so this one is redundant.
DROP INDEX IF EXISTS idx_submissions_question;

-- Composite indexes matching the hot per-aspirant dashboard queries.
CREATE INDEX IF NOT EXISTS idx_topic_progress_aspirant_status ON topic_progress(aspirant_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_goals_aspirant_date ON daily_goals(aspirant_id, goal_date);
