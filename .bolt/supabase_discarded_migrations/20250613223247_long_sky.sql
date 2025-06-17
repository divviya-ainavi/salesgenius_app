/*
  # Storage Bucket Setup for Call Transcripts

  1. Storage Configuration
    - Create call-transcripts bucket with proper settings
    - Configure file size limits and allowed MIME types
    - Set up public access for shareable links

  2. Security Policies
    - Enable RLS on storage objects
    - Create policies for authenticated user access
    - Add demo user access policy
    - Allow public read access for sharing

  Note: This migration uses Supabase storage functions instead of direct table manipulation
*/

-- Create the storage bucket using Supabase's storage functions
SELECT storage.create_bucket(
  'call-transcripts',
  '{
    "public": true,
    "file_size_limit": 52428800,
    "allowed_mime_types": [
      "text/plain", 
      "text/vtt",
      "application/pdf", 
      "text/csv", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
      "application/msword", 
      "audio/mpeg", 
      "audio/wav", 
      "audio/mp4", 
      "video/mp4", 
      "video/quicktime"
    ]
  }'::jsonb
);

-- Update bucket settings if it already exists
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
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
WHERE id = 'call-transcripts';

-- Create storage policies using Supabase's policy functions
-- Note: We'll create these policies only if they don't exist

-- Policy: Users can upload files to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own files'
  ) THEN
    CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'call-transcripts' AND
      (string_to_array(name, '/'))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy: Users can view their own files  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own files'
  ) THEN
    CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'call-transcripts' AND
      (string_to_array(name, '/'))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy: Users can update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own files'
  ) THEN
    CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'call-transcripts' AND
      (string_to_array(name, '/'))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy: Users can delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own files'
  ) THEN
    CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'call-transcripts' AND
      (string_to_array(name, '/'))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy: Allow public read access for shareable links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for shareable links'
  ) THEN
    CREATE POLICY "Public read access for shareable links" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'call-transcripts');
  END IF;
END $$;

-- Policy: Demo Sales Manager access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Demo Sales Manager storage access'
  ) THEN
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
  END IF;
END $$;