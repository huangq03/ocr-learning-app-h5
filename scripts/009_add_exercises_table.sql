-- Step 1: Create the new ENUM type for different kinds of exercises.
CREATE TYPE exercise_type AS ENUM ('dictation', 'recitation');

-- Step 2: Create the new generic 'exercises' table.
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    text_item_id UUID NOT NULL REFERENCES text_items(id),
    exercise_type exercise_type NOT NULL,
    target_text TEXT,
    user_input TEXT,
    accuracy_score INTEGER,
    mistakes_count INTEGER,
    completion_time_seconds INTEGER,
    details JSONB,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_exercises_user_id_completed_at ON exercises(user_id, completed_at DESC);
CREATE INDEX idx_exercises_text_item_id ON exercises(text_item_id);

-- Step 3: Migrate all existing data from 'dictation_exercises' to the new 'exercises' table.
-- We set the 'exercise_type' to 'dictation' for all migrated records.
INSERT INTO exercises (
    user_id,
    text_item_id,
    exercise_type,
    target_text,
    user_input,
    accuracy_score,
    mistakes_count,
    completion_time_seconds,
    completed_at
)
SELECT
    user_id,
    text_item_id,
    'dictation'::exercise_type,
    target_text,
    user_input,
    accuracy_score,
    mistakes_count,
    completion_time_seconds,
    completed_at
FROM
    dictation_exercises;

-- Step 4: Rename the old table to keep it as a backup.
ALTER TABLE dictation_exercises RENAME TO dictation_exercises_old;
