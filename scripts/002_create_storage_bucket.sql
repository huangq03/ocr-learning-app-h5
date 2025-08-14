-- Create storage bucket for document images
-- This script sets up Supabase Storage for storing photos

-- Create a bucket for storing document images
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own document images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy to allow users to view their own images
CREATE POLICY "Users can view their own document images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy to allow users to update their own images
CREATE POLICY "Users can update their own document images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy to allow users to delete their own images
CREATE POLICY "Users can delete their own document images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
