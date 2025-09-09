-- Create a temporary table to hold the raw dictionary data
CREATE TABLE IF NOT EXISTS public.temp_dictionary (
  id SERIAL PRIMARY KEY,
  "name" VARCHAR(80) NOT NULL,
  american_phonetic_symbol VARCHAR(80) NULL,
  english_phonetic_symbol VARCHAR(80) NULL,
  difficulty_level NUMERIC(15, 10) NULL,
  explanation TEXT NULL,
  english_description VARCHAR(800) NULL,
  image varchar(80) NULL,
  word_classes VARCHAR(200) NULL,
  updated_at timestamptz NULL,
  modified_by varchar(80) NULL,
  name_normalized VARCHAR(80) NULL -- This will be populated during the cleaning step
);