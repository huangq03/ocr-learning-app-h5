-- Create text_items table
create table IF NOT EXISTS public.text_items (
  id uuid not null default uuid_generate_v4 (),
  user_id uuid not null,
  document_id uuid not null,
  content text not null,
  item_type character varying(20),
  start_position integer null,
  end_position integer null,
  context text null,
  user_definition text null,
  difficulty_level integer null default 1,
  is_mastered BOOLEAN DEFAULT FALSE,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint text_items_pkey primary key (id),
  constraint unique_text_item unique (user_id, document_id, content),
  constraint text_items_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint text_items_user_id_fkey foreign KEY (user_id) references public.users (id) on delete CASCADE,
  constraint text_items_difficulty_level_check check (
    (
      (difficulty_level >= 1)
      and (difficulty_level <= 5)
    )
  ),
  constraint text_items_item_type_check check (
    (
      (item_type)::text = any (
        (
          array[
            'word'::character varying,
            'phrase'::character varying,
            'sentence'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_text_items_user_id on public.text_items using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_text_items_document_id on public.text_items using btree (document_id) TABLESPACE pg_default;

create index IF not exists idx_text_items_type on public.text_items using btree (item_type) TABLESPACE pg_default;

create trigger update_progress_on_text_item_insert
after INSERT on text_items for EACH row
execute FUNCTION trigger_update_user_progress ();

create trigger update_text_items_updated_at BEFORE
update on text_items for EACH row
execute FUNCTION update_updated_at_column ();