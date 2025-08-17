-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  file_path TEXT,
  recognized_text JSON,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- Create selections table
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id UUID REFERENCES selections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  interval_days INT NOT NULL DEFAULT 1,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own documents" ON documents FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY "Users can insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own selections" ON selections FOR SELECT USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = selections.document_id AND documents.user_id = auth.uid() AND documents.is_deleted = false));
CREATE POLICY "Users can insert their own selections" ON selections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = selections.document_id AND documents.user_id = auth.uid() AND documents.is_deleted = false));

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);