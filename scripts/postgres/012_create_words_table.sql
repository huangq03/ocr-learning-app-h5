-- Create the words table to store rich dictionary information
CREATE TABLE IF NOT EXISTS public.words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL,
  american_phonetic_symbol VARCHAR(80) NULL,
  english_phonetic_symbol VARCHAR(80) NULL,
  en_pronunciation VARCHAR(255) NULL,
  us_pronunciation VARCHAR(255) NULL,
  difficulty_level NUMERIC(15, 10) NULL,
  explanation TEXT NULL,
  english_description VARCHAR(800) NULL,
  word_classes VARCHAR(200) NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  CONSTRAINT word_name_unique UNIQUE (name)
);

-- Add an index on the name column for faster lookups
CREATE INDEX IF NOT EXISTS idx_words_name ON public.words(name);
