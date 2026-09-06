ALTER TABLE pyqs
ALTER COLUMN answer_quality TYPE INTEGER
USING answer_quality::INTEGER;
