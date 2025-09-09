-- Add word_id to text_items to link to the new words table
ALTER TABLE public.text_items
ADD COLUMN word_id UUID NULL,
ADD CONSTRAINT fk_word_id
  FOREIGN KEY (word_id)
  REFERENCES public.words(id)
  ON DELETE SET NULL;

-- Add an index on the new word_id column
CREATE INDEX IF NOT EXISTS idx_text_items_word_id ON public.text_items(word_id);
