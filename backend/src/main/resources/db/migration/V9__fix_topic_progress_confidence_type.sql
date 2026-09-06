ALTER TABLE topic_progress
ALTER COLUMN confidence TYPE INTEGER
USING confidence::INTEGER;
