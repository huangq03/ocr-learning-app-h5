-- Create spaced_repetition_schedule table
CREATE TABLE IF NOT EXISTS spaced_repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text_item_id UUID REFERENCES text_items(id) ON DELETE CASCADE,
    next_review_date DATE NOT NULL,
    interval_days INTEGER NOT NULL,
    ease_factor REAL NOT NULL,
    repetition_count INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
