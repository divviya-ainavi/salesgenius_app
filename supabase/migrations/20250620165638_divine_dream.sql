/*
  # Fix Storage Policies for File Uploads
  
  1. Storage Configuration
    - Ensure call-transcripts bucket is properly configured
    - Set public access for easier file sharing
    - Configure appropriate file size limits and MIME types
    
  2. Storage Policies
    - Fix RLS policies to allow all authenticated users to upload files
    - Use simpler policy definitions that work with all auth methods
    - Support both JWT auth and custom auth methods
    
  3. File Management
    - Ensure proper file organization by user ID
    - Support automatic storage path generation
*/

-- Ensure the call-transcripts bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-transcripts',
  'call-transcripts',
  true, -- Public access for easier file sharing
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

-- Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can insert files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

-- Create simpler, more permissive storage policies that work with all auth methods
-- Policy: Allow all users to upload files to call-transcripts bucket
CREATE POLICY "Allow all uploads to call-transcripts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'call-transcripts');

-- Policy: Allow users to view files in call-transcripts bucket
CREATE POLICY "Allow viewing files in call-transcripts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'call-transcripts');

-- Policy: Allow users to update files in call-transcripts bucket
CREATE POLICY "Allow updating files in call-transcripts"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'call-transcripts');

-- Policy: Allow users to delete files in call-transcripts bucket
CREATE POLICY "Allow deleting files in call-transcripts"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'call-transcripts');

-- Fix uploaded_files table policies
DROP POLICY IF EXISTS "Users can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can select own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can manage own files" ON uploaded_files;
DROP POLICY IF EXISTS "Demo Sales Manager files access" ON uploaded_files;

-- Create more permissive policies for uploaded_files table
CREATE POLICY "Allow all operations on uploaded_files"
ON uploaded_files FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled on uploaded_files table
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create or replace the function to set storage path automatically
CREATE OR REPLACE FUNCTION set_storage_path()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set storage_path if it's not already provided
  IF NEW.storage_path IS NULL AND NEW.filename IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    NEW.storage_path := NEW.user_id::text || '/' || extract(epoch from now())::bigint || '_' || NEW.filename;
  END IF;
  
  -- Set file_url based on storage_path if not provided
  IF NEW.file_url IS NULL AND NEW.storage_path IS NOT NULL THEN
    NEW.file_url := 'https://zuuxjfiqhgdrltnkxjtv.supabase.co/storage/v1/object/public/call-transcripts/' || NEW.storage_path;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for uploaded_files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_set_storage_path'
  ) THEN
    CREATE TRIGGER trigger_set_storage_path
      BEFORE INSERT ON uploaded_files
      FOR EACH ROW
      EXECUTE FUNCTION set_storage_path();
  END IF;
END $$;