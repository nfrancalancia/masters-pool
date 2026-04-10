-- Add prev_position column to track position movement between score refreshes
ALTER TABLE golfers ADD COLUMN IF NOT EXISTS prev_position TEXT;
