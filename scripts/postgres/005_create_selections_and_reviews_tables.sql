-- Create selections table
CREATE TABLE IF NOT EXISTS selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    selection_id UUID REFERENCES selections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
