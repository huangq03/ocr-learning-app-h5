CREATE OR REPLACE FUNCTION get_mastered_items_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    mastered_count INT;
BEGIN
    WITH last_dictation AS (
        SELECT
            text_item_id,
            MAX(completed_at) AS last_completed_at
        FROM
            dictation_exercises
        WHERE
            user_id = p_user_id
        GROUP BY
            text_item_id
    ),
    latest_attempts AS (
        SELECT
            d.text_item_id,
            d.accuracy_score
        FROM
            dictation_exercises d
        INNER JOIN
            last_dictation ld ON d.text_item_id = ld.text_item_id AND d.completed_at = ld.last_completed_at
        WHERE
            d.user_id = p_user_id
    )
    SELECT
        COUNT(*)
    INTO
        mastered_count
    FROM
        latest_attempts
    WHERE
        accuracy_score = 100;

    RETURN mastered_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_day_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    streak INT := 0;
    last_date DATE := NULL;
    current_date DATE;
    is_today BOOLEAN := FALSE;
BEGIN
    FOR current_date IN
        SELECT DISTINCT completed_at::date
        FROM dictation_exercises
        WHERE user_id = p_user_id
        ORDER BY completed_at::date DESC
    LOOP
        IF last_date IS NULL THEN
            -- First iteration
            IF current_date = (NOW() AT TIME ZONE 'utc')::date THEN
                streak := 1;
                is_today := TRUE;
            ELSIF current_date = (NOW() AT TIME ZONE 'utc')::date - INTERVAL '1 day' THEN
                streak := 1;
            ELSE
                RETURN 0; -- No activity today or yesterday, so streak is 0
            END IF;
        ELSE
            -- Subsequent iterations
            IF current_date = last_date - INTERVAL '1 day' THEN
                streak := streak + 1;
            ELSE
                -- Gap in dates, so streak is broken
                EXIT;
            END IF;
        END IF;
        last_date := current_date;
    END LOOP;

    RETURN streak;
END;
$$ LANGUAGE plpgsql;