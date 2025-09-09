-- This script creates a single function to save an exercise result
-- and update the corresponding text_item's is_mastered flag in one transaction.

CREATE OR REPLACE FUNCTION save_exercise_and_update_mastery(
    p_user_id UUID,
    p_text_item_id UUID,
    p_exercise_type exercise_type,
    p_target_text TEXT,
    p_user_input TEXT,
    p_accuracy_score INTEGER,
    p_mistakes_count INTEGER,
    p_completion_time_seconds INTEGER,
    p_details JSONB
)
RETURNS void AS $$
DECLARE
    v_is_mastered BOOLEAN;
BEGIN
    -- Insert the exercise result
    INSERT INTO exercises (user_id, text_item_id, exercise_type, target_text, user_input, accuracy_score, mistakes_count, completion_time_seconds, details, completed_at)
    VALUES (p_user_id, p_text_item_id, p_exercise_type, p_target_text, p_user_input, p_accuracy_score, p_mistakes_count, p_completion_time_seconds, p_details, NOW());

    -- Update the is_mastered flag on the text_item based on dictation score
    IF p_exercise_type = 'dictation' THEN
        v_is_mastered := p_accuracy_score = 100;
        UPDATE text_items
        SET is_mastered = v_is_mastered
        WHERE id = p_text_item_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
