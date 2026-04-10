-- Store hole-by-hole scorecard data as JSON
-- Format: { "rounds": [{ "round": 1, "strokes": 71, "holes": [{ "hole": 1, "strokes": 4, "par": 4, "score": 0 }, ...] }] }
ALTER TABLE golfers ADD COLUMN IF NOT EXISTS scorecard JSONB DEFAULT '{"rounds":[]}';
