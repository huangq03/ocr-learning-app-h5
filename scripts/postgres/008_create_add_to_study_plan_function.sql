-- scripts/008_create_add_to_study_plan_function.sql
CREATE OR REPLACE FUNCTION add_to_study_plan(p_user_id UUID, p_document_id UUID, p_items TEXT[])
RETURNS TABLE(
    id UUID,
    user_id UUID,
    document_id UUID,
    content TEXT,
    item_type VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    word_id UUID,
    name VARCHAR(80),
    american_phonetic_symbol VARCHAR(80),
    english_phonetic_symbol VARCHAR(80),
    en_pronunciation VARCHAR(255),
    us_pronunciation VARCHAR(255),
    explanation TEXT
) AS $$
#variable_conflict use_column
DECLARE
    item_text TEXT;
    v_text_item_id UUID;
    v_word_id UUID;
    schedule_exists BOOLEAN;
BEGIN
    FOREACH item_text IN ARRAY p_items
    LOOP
        -- Look up the word in the dictionary, ignoring case
        SELECT id INTO v_word_id FROM words WHERE LOWER(name) = LOWER(item_text);

        -- Get or create a text_item, now with word_id
        INSERT INTO text_items AS ti (user_id, document_id, content, item_type, word_id)
        VALUES (p_user_id, p_document_id, item_text, CASE WHEN array_length(string_to_array(item_text, ' '), 1) > 1 THEN 'phrase' ELSE 'word' END, v_word_id)
        ON CONFLICT (user_id, document_id, content)
        DO UPDATE SET updated_at = NOW(), word_id = v_word_id -- Also update word_id on conflict
        RETURNING ti.id INTO v_text_item_id;

        -- If the insert didn't return an ID (meaning it was an existing item), get the ID
        IF v_text_item_id IS NULL THEN
            SELECT id INTO v_text_item_id
            FROM text_items
            WHERE user_id = p_user_id
            AND document_id = p_document_id
            AND content = item_text;
        END IF;

        -- Check if a spaced_repetition_schedule exists for this text_item
        SELECT EXISTS (
            SELECT 1 FROM spaced_repetition_schedule
            WHERE text_item_id = v_text_item_id
            AND user_id = p_user_id
        ) INTO schedule_exists;

        -- Create a corresponding schedule if it doesn't exist
        IF NOT schedule_exists THEN
            INSERT INTO spaced_repetition_schedule (user_id, text_item_id)
            VALUES (p_user_id, v_text_item_id);
        END IF;
    END LOOP;

    -- Return the newly created/updated text_items, now joined with words data
    RETURN QUERY
    SELECT
        ti.id, ti.user_id, ti.document_id, ti.content, ti.item_type, ti.created_at, ti.updated_at,
        ti.word_id,
        w.name, w.american_phonetic_symbol, w.english_phonetic_symbol, w.en_pronunciation, w.us_pronunciation, w.explanation
    FROM
        text_items ti
    LEFT JOIN
        words w ON ti.word_id = w.id
    WHERE
        ti.user_id = p_user_id
        AND ti.document_id = p_document_id
        AND ti.content = ANY(p_items);
END;
$$ LANGUAGE plpgsql;
