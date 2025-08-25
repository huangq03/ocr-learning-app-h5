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
  constraint user_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_user_progress_updated_at BEFORE
update on user_progress for EACH row
execute FUNCTION update_updated_at_column ();