-- Create spaced_repetition_schedule table
create table IF NOT EXISTS public.spaced_repetition_schedule (
  id uuid not null default uuid_generate_v4 (),
  text_item_id uuid not null,
  user_id uuid not null,
  repetition_number integer null default 0,
  ease_factor numeric(4, 2) null default 2.50,
  interval_days integer null default 1,
  next_review_date date not null default CURRENT_DATE,
  last_reviewed_at timestamp with time zone null,
  quality_score integer null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint spaced_repetition_schedule_pkey primary key (id),
  constraint spaced_repetition_schedule_text_item_id_fkey foreign KEY (text_item_id) references text_items (id) on delete CASCADE,
  constraint spaced_repetition_schedule_user_id_fkey foreign KEY (user_id) references public.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_spaced_repetition_user_id on public.spaced_repetition_schedule using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_spaced_repetition_next_review on public.spaced_repetition_schedule using btree (next_review_date) TABLESPACE pg_default;

create index IF not exists idx_spaced_repetition_active on public.spaced_repetition_schedule using btree (is_active) TABLESPACE pg_default;

create trigger update_spaced_repetition_updated_at BEFORE
update on spaced_repetition_schedule for EACH row
execute FUNCTION update_updated_at_column ();