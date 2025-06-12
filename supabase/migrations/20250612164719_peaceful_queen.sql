/*
  # Fix Storage Bucket and Policies

  1. Bucket Management
    - Ensure transcript-files bucket exists with proper configuration
    - Set appropriate file size limits and allowed MIME types
    - Enable public access for shareable links

  2. Storage Policies
    - Create user-specific folder access policies
    - Enable public read access for shareable links
    - Add demo user access for testing

  3. File Management
    - Support for text files (.txt, .vtt) and PDFs
    - Organized by user ID folders
    - Shareable public URLs
*/

-- First, ensure the bucket exists by inserting or updating it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transcript-files',
  'transcript-files', 
  true,
  52428800, -- 50MB limit
  ARRAY[
    'text/plain',
    'text/vtt', 
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop any existing conflicting policies to start fresh
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

-- Create storage policies for transcript-files bucket
-- These policies automatically enable RLS when created

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access for shareable links
CREATE POLICY "Public read access for shareable links" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'transcript-files');

-- Policy: Demo Sales Manager access
CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
FOR ALL TO public
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
)
WITH CHECK (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
);