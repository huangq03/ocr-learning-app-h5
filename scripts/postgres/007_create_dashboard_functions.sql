CREATE OR REPLACE FUNCTION get_mastered_items_count(p_user_id UUID)
RETURNS INT AS $func$
DECLARE
    mastered_count INT;
BEGIN
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
$func$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_day_streak(p_user_id UUID)
RETURNS INT AS $func$
DECLARE
    streak_length INT;
BEGIN
    WITH daily_activity AS (
        -- 1. Get all unique days the user had activity from any exercise type
        SELECT DISTINCT completed_at::date AS activity_date
        FROM exercises
        WHERE user_id = p_user_id
    ),
    streaks AS (
        -- 2. Group consecutive days together using a window function.
        -- The difference between a date and its row number (when ordered by date)
        -- will be constant for any consecutive sequence of dates.
        SELECT
            activity_date,
            activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::int AS streak_group
        FROM daily_activity
    )
    -- 3. Count the days in the most recent streak, but only if it's current.
    SELECT COUNT(*)
    INTO streak_length
    FROM streaks
    WHERE streak_group = (
        -- Subquery to find the streak_group for the most recent activity day
        SELECT streak_group FROM streaks ORDER BY activity_date DESC LIMIT 1
    )
    AND (
        -- Subquery to ensure the most recent activity day was today or yesterday
        SELECT MAX(activity_date) FROM streaks
    ) >= (NOW() AT TIME ZONE 'utc')::date - INTERVAL '1 day';

    RETURN COALESCE(streak_length, 0);
END;
$func$ LANGUAGE plpgsql;