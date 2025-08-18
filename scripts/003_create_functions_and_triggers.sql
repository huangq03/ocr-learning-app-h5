-- Create database functions and triggers for automated tasks
-- This script adds helper functions and automated updates

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_items_updated_at 
    BEFORE UPDATE ON text_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaced_repetition_updated_at 
    BEFORE UPDATE ON spaced_repetition_schedule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next review date using SM-2 algorithm
CREATE OR REPLACE FUNCTION calculate_next_review(
    current_ease_factor DECIMAL,
    current_interval INTEGER,
    quality_score INTEGER
) RETURNS TABLE(
    new_ease_factor DECIMAL,
    new_interval INTEGER,
    next_review DATE
) AS $$
DECLARE
    ease_factor DECIMAL := current_ease_factor;
    interval_days INTEGER := current_interval;
BEGIN
    -- SM-2 Algorithm implementation
    IF quality_score >= 3 THEN
        -- Correct response
        IF current_interval = 1 THEN
            interval_days := 6;
        ELSIF current_interval = 6 THEN
            interval_days := 6;
        ELSE
            interval_days := ROUND(current_interval * ease_factor);
        END IF;
        
        ease_factor := ease_factor + (0.1 - (5 - quality_score) * (0.08 + (5 - quality_score) * 0.02));
    ELSE
        -- Incorrect response - reset interval
        interval_days := 1;
    END IF;
    
    -- Ensure ease factor doesn't go below 1.3
    IF ease_factor < 1.3 THEN
        ease_factor := 1.3;
    END IF;
    
    RETURN QUERY SELECT 
        ease_factor,
        interval_days,
        (CURRENT_DATE + interval_days)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user progress statistics
CREATE OR REPLACE FUNCTION update_user_progress_stats(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_progress (
        user_id,
        total_documents,
        total_text_items,
        items_mastered,
        items_learning,
        last_study_date
    )
    SELECT 
        user_uuid,
        (SELECT COUNT(*) FROM documents WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM text_items WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM spaced_repetition_schedule 
         WHERE user_id = user_uuid AND ease_factor >= 2.5 AND repetition_number >= 3),
        (SELECT COUNT(*) FROM spaced_repetition_schedule 
         WHERE user_id = user_uuid AND is_active = true),
        CURRENT_DATE
    ON CONFLICT (user_id) DO UPDATE SET
        total_documents = EXCLUDED.total_documents,
        total_text_items = EXCLUDED.total_text_items,
        items_mastered = EXCLUDED.items_mastered,
        items_learning = EXCLUDED.items_learning,
        last_study_date = EXCLUDED.last_study_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user progress when text items are added
CREATE OR REPLACE FUNCTION trigger_update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_progress_stats(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_on_text_item_insert
    AFTER INSERT ON text_items
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_progress();

CREATE TRIGGER update_progress_on_document_insert
    AFTER INSERT ON documents
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_progress();
