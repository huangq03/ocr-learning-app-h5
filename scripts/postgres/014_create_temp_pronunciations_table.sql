-- Create a temporary table to hold the raw pronunciation data
CREATE TABLE IF NOT EXISTS public.temp_pronunciations (
  id SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NULL,
  en_pronunciation VARCHAR(255) NULL,
  us_pronunciation VARCHAR(255) NULL,
  "createdAt" timestamptz(6) NOT NULL,
  "updatedAt" timestamptz(6) NOT NULL,
  name_normalized VARCHAR(255) NULL -- This will be populated during the cleaning step
);
