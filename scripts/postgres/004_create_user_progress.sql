-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_documents INTEGER DEFAULT 0,
    total_text_items INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0
);


create table IF NOT EXISTS public.user_progress (
  user_id uuid not null,
  total_documents integer null default 0,
  total_text_items integer null default 0,
  items_mastered integer null default 0,
  items_learning integer null default 0,
  current_streak_days integer null default 0,
  longest_streak_days integer null default 0,
  total_study_time_minutes integer null default 0,
  last_study_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_progress_pkey primary key (user_id),
  constraint user_progress_user_id_fkey foreign KEY (user_id) references public.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_user_progress_updated_at BEFORE
update on user_progress for EACH row
execute FUNCTION update_updated_at_column ();


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