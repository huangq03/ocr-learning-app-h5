-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    email_confirmed_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS users_email_idx ON users USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS confirmation_token_idx ON users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$');
CREATE UNIQUE INDEX IF NOT EXISTS recovery_token_idx ON users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$');

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    image_path TEXT,
    recognized_text JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table (alternative version)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid not null default uuid_generate_v4 (),
  user_id uuid not null,
  image_url text not null,
  image_path text not null,
  file_size integer null,
  mime_type character varying(100) null,
  recognized_text jsonb null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint documents_pkey primary key (id),
  constraint documents_user_id_fkey foreign KEY (user_id) references public.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id on public.documents using btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_documents_created_at on public.documents using btree (created_at desc) TABLESPACE pg_default;

-- Create trigger to update updated_at column
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user progress
CREATE OR REPLACE FUNCTION public.trigger_update_user_progress()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM update_user_progress_stats(NEW.user_id);
    RETURN NEW;
END;
$function$;

-- Create trigger to update user progress when document is inserted
CREATE TRIGGER update_progress_on_document_insert AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION trigger_update_user_progress();