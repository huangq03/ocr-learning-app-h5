-- Add a 'name' column to the documents table
ALTER TABLE public.documents
ADD COLUMN name VARCHAR(255) NULL;
