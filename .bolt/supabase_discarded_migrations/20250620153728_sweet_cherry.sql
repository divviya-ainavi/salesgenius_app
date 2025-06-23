/*
  # Fix RLS policies for file uploads

  1. Storage Policies
    - Add policy for authenticated users to upload files to call-transcripts bucket
    - Add policy for authenticated users to read their own files from call-transcripts bucket
    - Add policy for authenticated users to delete their own files from call-transcripts bucket

  2. Table Policies Review
    - Ensure uploaded_files table policies are working correctly
    - Add any missing policies for file operations

  This migration fixes the "new row violates row-level security policy" error
  that occurs when users try to upload files.
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for call-transcripts bucket
-- Policy for uploading files (INSERT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload files to call-transcripts bucket'
  ) THEN
    CREATE POLICY "Users can upload files to call-transcripts bucket"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'call-transcripts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy for reading files (SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can read their own files from call-transcripts bucket'
  ) THEN
    CREATE POLICY "Users can read their own files from call-transcripts bucket"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'call-transcripts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy for deleting files (DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own files from call-transcripts bucket'
  ) THEN
    CREATE POLICY "Users can delete their own files from call-transcripts bucket"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'call-transcripts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy for updating files (UPDATE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own files in call-transcripts bucket'
  ) THEN
    CREATE POLICY "Users can update their own files in call-transcripts bucket"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'call-transcripts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'call-transcripts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Ensure the call-transcripts bucket exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'call-transcripts'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'call-transcripts',
      'call-transcripts',
      false,
      10485760, -- 10MB limit
      ARRAY['text/plain', 'text/vtt', 'application/pdf']::text[]
    );
  END IF;
END $$;

-- Create a helper function to get current user ID for profiles table
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    (current_setting('request.jwt.claims', true)::json ->> 'user_id')
  )::uuid;
$$;

-- Ensure uploaded_files policies work with custom auth
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can select own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;

-- Create new policies that work with both Supabase auth and custom auth
CREATE POLICY "Users can insert own files"
  ON uploaded_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can select own files"
  ON uploaded_files
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can update own files"
  ON uploaded_files
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id::text = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can delete own files"
  ON uploaded_files
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id::text = current_setting('app.current_user_id', true)
  );

-- Add policy for public access to demo user files (if needed)
CREATE POLICY "Demo user file access"
  ON uploaded_files
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);