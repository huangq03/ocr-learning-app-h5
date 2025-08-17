-- This script creates the missing user_progress table.
-- Run this script on your Supabase database to fix the statistics tracking.

-- Create the user_progress table to store aggregated stats
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_documents INT NOT NULL DEFAULT 0,
  total_text_items INT NOT NULL DEFAULT 0,
  items_mastered INT NOT NULL DEFAULT 0,
  items_learning INT NOT NULL DEFAULT 0,
  current_streak_days INT NOT NULL DEFAULT 0,
  total_study_time_minutes INT NOT NULL DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a trigger to automatically update the updated_at timestamp
-- This assumes the function 'update_updated_at_column' already exists from script 003.
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- After running this, your statistics will be correct for all *new* documents.
-- If you have existing documents and want to backfill their stats, you can run a script in the Supabase SQL Editor to call the update function for all existing users.
