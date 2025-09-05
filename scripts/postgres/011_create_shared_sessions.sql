
-- Create the shared_sets table to store information about each shared link
CREATE TABLE IF NOT EXISTS public.shared_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    engagement_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create the shared_set_items table to link shared sets to text_items
CREATE TABLE IF NOT EXISTS public.shared_set_items (
    shared_set_id UUID NOT NULL REFERENCES public.shared_sets(id) ON DELETE CASCADE,
    text_item_id UUID NOT NULL REFERENCES public.text_items(id) ON DELETE CASCADE,
    PRIMARY KEY (shared_set_id, text_item_id)
);

-- Create the shared_set_visits table to log each access to a shared link
CREATE TABLE IF NOT EXISTS public.shared_set_visits (
    id BIGSERIAL PRIMARY KEY,
    shared_set_id UUID NOT NULL REFERENCES public.shared_sets(id) ON DELETE CASCADE,
    visitor_hash TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_sets_owner_user_id ON public.shared_sets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_set_visits_shared_set_id ON public.shared_set_visits(shared_set_id);
CREATE INDEX IF NOT EXISTS idx_shared_set_visits_visitor_hash ON public.shared_set_visits(visitor_hash);

-- Create a function to increment the engagement count for a shared set
CREATE OR REPLACE FUNCTION increment_engagement_count(set_id UUID)
RETURNS VOID AS $$
  UPDATE shared_sets
  SET engagement_count = engagement_count + 1
  WHERE id = set_id;
$$ LANGUAGE sql;

-- Create a function to create a shared set and link items atomically
CREATE OR REPLACE FUNCTION create_shared_set_and_link_items(
  p_user_id UUID,
  p_title TEXT,
  p_item_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  new_set_id UUID;
BEGIN
  INSERT INTO shared_sets (owner_user_id, title)
  VALUES (p_user_id, p_title)
  RETURNING id INTO new_set_id;

  FOR i IN 1..array_length(p_item_ids, 1) LOOP
    INSERT INTO shared_set_items (shared_set_id, text_item_id)
    VALUES (new_set_id, p_item_ids[i]);
  END LOOP;

  RETURN new_set_id;
END;
$$ LANGUAGE plpgsql;
