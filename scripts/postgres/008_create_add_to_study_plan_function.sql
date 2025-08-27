-- scripts/008_create_add_to_study_plan_function.sql
CREATE OR REPLACE FUNCTION add_to_study_plan(p_user_id UUID, p_document_id UUID, p_items TEXT[])
RETURNS TABLE(id UUID, user_id UUID, document_id UUID, content TEXT, item_type character varying(20), created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) AS $$
#variable_conflict use_column
DECLARE
    item_text TEXT;
    v_text_item_id UUID;
    schedule_exists BOOLEAN;
    inserted_count INTEGER := 0;
    newly_inserted_items UUID[] := ARRAY[]::UUID[];
BEGIN
    FOREACH item_text IN ARRAY p_items
    LOOP
        -- Get or create a text_item
        INSERT INTO text_items AS ti (user_id, document_id, content, item_type)
        VALUES (p_user_id, p_document_id, item_text, CASE WHEN array_length(string_to_array(item_text, ' '), 1) > 1 THEN 'phrase' ELSE 'word' END)
        ON CONFLICT (user_id, document_id, content)
        DO UPDATE SET updated_at = NOW()  -- Update timestamp even if item exists
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
            inserted_count := inserted_count + 1;
            newly_inserted_items := array_append(newly_inserted_items, v_text_item_id);
            INSERT INTO spaced_repetition_schedule (user_id, text_item_id)
            VALUES (p_user_id, v_text_item_id);
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT ti.id, ti.user_id, ti.document_id, ti.content, ti.item_type, ti.created_at, ti.updated_at
    FROM text_items ti
    WHERE ti.user_id = p_user_id
    AND ti.document_id = p_document_id
    AND ti.content = ANY(p_items);
END;
$$ LANGUAGE plpgsql;
