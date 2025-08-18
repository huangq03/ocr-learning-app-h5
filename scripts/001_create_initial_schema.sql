-- Create the main tables for the OCR Learning App
-- This script sets up the core database structure

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table - stores photos taken by users
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- URL to the stored image in Supabase Storage
    image_path TEXT NOT NULL, -- Path in storage bucket
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recognized_text JSONB, -- Store OCR results directly in the document
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- Text items table - stores user-selected words, phrases, strings for learning
CREATE TABLE text_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- The selected text (word, phrase, or string)
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('word', 'phrase', 'sentence')),
    start_position INTEGER, -- Position in original text where selection starts
    end_position INTEGER, -- Position in original text where selection ends
    context TEXT, -- Surrounding text for context
    user_definition TEXT, -- User's custom definition or notes
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_text_item UNIQUE (user_id, document_id, content)
);

-- Spaced repetition schedule table - implements Ebbinghaus forgetting curve
CREATE TABLE spaced_repetition_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_item_id UUID NOT NULL REFERENCES text_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repetition_number INTEGER DEFAULT 0, -- How many times reviewed
    ease_factor DECIMAL(4,2) DEFAULT 2.50, -- Ease factor for SM-2 algorithm
    interval_days INTEGER DEFAULT 1, -- Days until next review
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    quality_score INTEGER, -- Last quality score (0-5) from user feedback
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dictation exercises table - stores dictation practice sessions
CREATE TABLE dictation_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text_item_id UUID NOT NULL REFERENCES text_items(id) ON DELETE CASCADE,
    exercise_type VARCHAR(20) DEFAULT 'typing' CHECK (exercise_type IN ('typing', 'speaking', 'writing')),
    target_text TEXT NOT NULL, -- The text user should type/speak
    user_input TEXT, -- What user actually typed/spoke
    accuracy_score DECIMAL(5,2), -- Accuracy percentage (0-100)
    completion_time_seconds INTEGER, -- Time taken to complete
    mistakes_count INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking table - overall learning statistics
CREATE TABLE user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_documents INTEGER DEFAULT 0,
    total_text_items INTEGER DEFAULT 0,
    items_mastered INTEGER DEFAULT 0, -- Items with high ease factor
    items_learning INTEGER DEFAULT 0, -- Items still in learning phase
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX idx_text_items_user_id ON text_items(user_id);
CREATE INDEX idx_text_items_document_id ON text_items(document_id);
CREATE INDEX idx_text_items_type ON text_items(item_type);

CREATE INDEX idx_spaced_repetition_user_id ON spaced_repetition_schedule(user_id);
CREATE INDEX idx_spaced_repetition_next_review ON spaced_repetition_schedule(next_review_date);
CREATE INDEX idx_spaced_repetition_active ON spaced_repetition_schedule(is_active);

CREATE INDEX idx_dictation_exercises_user_id ON dictation_exercises(user_id);
CREATE INDEX idx_dictation_exercises_text_item_id ON dictation_exercises(text_item_id);
CREATE INDEX idx_dictation_exercises_completed ON dictation_exercises(completed_at);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictation_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own data
CREATE POLICY "Users can only see their own documents" ON documents
    FOR ALL USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can only see their own text items" ON text_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own spaced repetition schedule" ON spaced_repetition_schedule
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own dictation exercises" ON dictation_exercises
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);