/*
  # Fix Storage Bucket and Policies

  1. Storage Setup
    - Create transcript-files bucket using INSERT
    - Configure bucket settings for file uploads
    - Set appropriate file size and MIME type limits

  2. Security Policies
    - Enable RLS on storage.objects
    - Create user-specific access policies
    - Allow public read access for shareable links
    - Special access for demo Sales Manager user

  3. File Organization
    - Files stored in user-specific folders: {user-id}/{filename}
    - Support for text, PDF, and audio/video files
    - 50MB file size limit
*/

-- Create the storage bucket by inserting directly into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transcript-files',
  'transcript-files',
  true,
  52428800, -- 50MB
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

-- Enable RLS on storage.objects if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'objects' AND n.nspname = 'storage'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can view their own files  
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow public read access for shareable links
CREATE POLICY "Public read access for shareable links" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'transcript-files');

-- Policy: Demo Sales Manager access (for demo purposes)
CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
FOR ALL TO public
USING (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = '00000000-0000-0000-0000-000000000003'
)
WITH CHECK (
  bucket_id = 'transcript-files' AND
  (string_to_array(name, '/'))[1] = '00000000-0000-0000-0000-000000000003'
);