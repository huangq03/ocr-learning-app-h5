-- scripts/007_create_add_to_study_plan_function.sql

CREATE OR REPLACE FUNCTION add_to_study_plan(p_user_id UUID, p_document_id UUID, p_items TEXT[])
RETURNS void AS $$
DECLARE
    item_text TEXT;
    new_text_item_id UUID;
BEGIN
    FOREACH item_text IN ARRAY p_items
    LOOP
        -- Create a new text_item
        INSERT INTO text_items (user_id, document_id, content, item_type)
        VALUES (p_user_id, p_document_id, item_text, CASE WHEN array_length(string_to_array(item_text, ' '), 1) > 1 THEN 'phrase' ELSE 'word' END)
        ON CONFLICT (user_id, document_id, content) DO NOTHING
        RETURNING id INTO new_text_item_id;

        -- Create a corresponding schedule if a new item was inserted
        IF new_text_item_id IS NOT NULL THEN
            INSERT INTO spaced_repetition_schedule (user_id, text_item_id)
            VALUES (p_user_id, new_text_item_id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
