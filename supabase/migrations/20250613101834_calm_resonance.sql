/*
  # Storage Bucket Setup for Call Transcripts

  1. Storage Configuration
    - Create 'call-transcripts' bucket for file storage
    - Configure public access for shareable links
    - Set file size limits and allowed MIME types
    - Enable user-specific folder organization

  2. Security Policies
    - Users can only access their own files
    - Public read access for shareable links
    - Demo user access for testing
*/

-- Create the storage bucket by inserting directly into storage.buckets
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
) VALUES (
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
  ],
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

-- Create storage policies with existence checks

-- Policy: Users can upload files to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own files'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
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
    EXECUTE 'CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
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
    EXECUTE 'CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
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
    EXECUTE 'CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
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
    EXECUTE 'CREATE POLICY "Public read access for shareable links" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = ''call-transcripts'')';
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
    EXECUTE 'CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
    FOR ALL TO public
    USING (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = ''00000000-0000-0000-0000-000000000003''
    )
    WITH CHECK (
      bucket_id = ''call-transcripts'' AND
      (storage.foldername(name))[1] = ''00000000-0000-0000-0000-000000000003''
    )';
  END IF;
END $$;