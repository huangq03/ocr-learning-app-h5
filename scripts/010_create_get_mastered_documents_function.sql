CREATE OR REPLACE FUNCTION get_mastered_documents(p_user_id UUID)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ, recognized_text JSONB) AS $$
BEGIN
    RETURN QUERY
    WITH last_exercise AS (
        SELECT
            text_item_id,
            MAX(completed_at) AS last_completed_at
        FROM
            exercises
        WHERE
            user_id = p_user_id AND exercise_type = 'dictation'
        GROUP BY
            text_item_id
    ),
    latest_attempts AS (
        SELECT
            d.text_item_id,
            d.accuracy_score
        FROM
            exercises d
        INNER JOIN
            last_exercise le ON d.text_item_id = le.text_item_id AND d.completed_at = le.last_completed_at
        WHERE
            d.user_id = p_user_id AND d.exercise_type = 'dictation'
    ),
    mastered_items AS (
      SELECT text_item_id from latest_attempts WHERE accuracy_score = 100
    )
    SELECT DISTINCT d.id, d.created_at, d.recognized_text
    FROM documents d
    JOIN text_items ti ON d.id = ti.document_id
    WHERE d.user_id = p_user_id AND ti.id IN (SELECT text_item_id FROM mastered_items)
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;
