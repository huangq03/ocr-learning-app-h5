-- Create dictation_exercises table
CREATE TABLE IF NOT EXISTS dictation_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    accuracy REAL,
    wpm REAL,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
