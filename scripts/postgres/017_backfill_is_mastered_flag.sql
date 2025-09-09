-- This script updates the is_mastered flag on text_items based on the official logic:
-- An item is mastered if the latest dictation exercise for it has an accuracy of 100.

-- Step 1: Reset all items to not mastered to ensure a clean slate.
UPDATE text_items SET is_mastered = FALSE;

-- Step 2: Identify and flag all items that are currently mastered.
WITH last_exercise AS (
    -- Find the most recent dictation exercise for each text item
    SELECT
        text_item_id,
        MAX(completed_at) AS last_completed_at
    FROM
        exercises
    WHERE
        exercise_type = 'dictation'
    GROUP BY
        text_item_id
),
mastered_items AS (
    -- From those latest exercises, find the ones with a perfect score
    SELECT
        d.text_item_id
    FROM
        exercises d
    INNER JOIN
        last_exercise le ON d.text_item_id = le.text_item_id AND d.completed_at = le.last_completed_at
    WHERE
        d.accuracy_score = 100
)
-- Update the flag for all text_items found in the above query
UPDATE text_items
SET is_mastered = TRUE
WHERE id IN (SELECT text_item_id FROM mastered_items);
