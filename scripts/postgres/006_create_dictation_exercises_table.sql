create table public.dictation_exercises (
  id uuid not null default uuid_generate_v4 (),
  user_id uuid not null,
  text_item_id uuid not null,
  exercise_type character varying(20) null default 'typing'::character varying,
  target_text text not null,
  user_input text null,
  accuracy_score numeric(5, 2) null,
  completion_time_seconds integer null,
  mistakes_count integer null default 0,
  hints_used integer null default 0,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint dictation_exercises_pkey primary key (id),
  constraint dictation_exercises_text_item_id_fkey foreign KEY (text_item_id) references text_items (id) on delete CASCADE,
  constraint dictation_exercises_user_id_fkey foreign KEY (user_id) references public.users (id) on delete CASCADE,
  constraint dictation_exercises_exercise_type_check check (
    (
      (exercise_type)::text = any (
        (
          array[
            'typing'::character varying,
            'speaking'::character varying,
            'writing'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_dictation_exercises_user_id on public.dictation_exercises using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_dictation_exercises_text_item_id on public.dictation_exercises using btree (text_item_id) TABLESPACE pg_default;

create index IF not exists idx_dictation_exercises_completed on public.dictation_exercises using btree (completed_at) TABLESPACE pg_default;