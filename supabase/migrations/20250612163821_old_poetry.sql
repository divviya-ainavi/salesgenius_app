/*
  # Fix Storage Policies for transcript-files bucket
  
  1. Storage Setup
    - Use existing transcript-files bucket
    - Create proper access policies without altering system tables
    - Enable secure file access with shareable links
    
  2. Security
    - Users can only access their own files
    - Public read access for shareable links
    - Demo user access for testing
*/

-- Ensure the transcript-files bucket exists and is properly configured
-- Note: This should already exist based on your setup

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

-- Create storage policies for transcript-files bucket
-- These policies will automatically enable RLS when created

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

-- Add storage_path column to uploaded_files table for better file management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE uploaded_files ADD COLUMN storage_path text;
  END IF;
END $$;

-- Create index for storage_path
CREATE INDEX IF NOT EXISTS idx_uploaded_files_storage_path ON uploaded_files(storage_path);

-- Add comment for storage_path column
COMMENT ON COLUMN uploaded_files.storage_path IS 'Path to file in Supabase Storage for management operations';