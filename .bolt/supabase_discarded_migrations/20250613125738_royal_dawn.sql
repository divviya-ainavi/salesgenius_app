/*
  # Create storage bucket for call transcripts

  1. Storage Setup
    - Create 'call-transcripts' bucket for file storage
    - Configure bucket settings for file uploads
    - Set appropriate file size limits and MIME types

  2. Security Policies
    - Users can manage their own files in user-specific folders
    - Public read access for shareable links
    - Demo user access for testing
*/

-- Insert the bucket directly into storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-transcripts',
  'call-transcripts', 
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
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
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
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can view their own files  
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow public read access for shareable links
CREATE POLICY "Public read access for shareable links" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'call-transcripts');

-- Policy: Demo Sales Manager access
CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
FOR ALL TO public
USING (
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = '00000000-0000-0000-0000-000000000003'
)
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  (string_to_array(name, '/'))[1] = '00000000-0000-0000-0000-000000000003'
);