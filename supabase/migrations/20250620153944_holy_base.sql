/*
  # Fix RLS policies for file uploads

  1. Storage Setup
    - Ensure call-transcripts bucket exists with proper configuration
    - Note: Storage policies must be created through Supabase dashboard or API

  2. Database Policies
    - Fix uploaded_files table policies to work with custom authentication
    - Add support for demo user access
    - Remove conflicting policies and recreate them

  3. Authentication Support
    - Support both Supabase auth and custom authentication system
    - Allow demo user access for testing
*/

-- Ensure the call-transcripts bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-transcripts',
  'call-transcripts',
  true, -- Set to public for easier access
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

-- Drop existing policies that might conflict with uploaded_files table
DROP POLICY IF EXISTS "Users can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can select own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can manage own files" ON uploaded_files;
DROP POLICY IF EXISTS "Demo user file access" ON uploaded_files;
DROP POLICY IF EXISTS "Demo Sales Manager files access" ON uploaded_files;

-- Create comprehensive policies for uploaded_files table that work with custom auth
CREATE POLICY "Users can insert own files"
  ON uploaded_files
  FOR INSERT
  TO public
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000003'::uuid OR
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can select own files"
  ON uploaded_files
  FOR SELECT
  TO public
  USING (
    user_id = '00000000-0000-0000-0000-000000000003'::uuid OR
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can update own files"
  ON uploaded_files
  FOR UPDATE
  TO public
  USING (
    user_id = '00000000-0000-0000-0000-000000000003'::uuid OR
    user_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can delete own files"
  ON uploaded_files
  FOR DELETE
  TO public
  USING (
    user_id = '00000000-0000-0000-0000-000000000003'::uuid OR
    user_id::text = current_setting('app.current_user_id', true)
  );

-- Add is_processed field to uploaded_files table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_files' AND column_name = 'is_processed'
  ) THEN
    ALTER TABLE uploaded_files ADD COLUMN is_processed boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster queries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_uploaded_files_is_processed'
  ) THEN
    CREATE INDEX idx_uploaded_files_is_processed ON uploaded_files (is_processed);
  END IF;
END $$;

-- Add storage_path column to uploaded_files table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE uploaded_files ADD COLUMN storage_path text;
    COMMENT ON COLUMN uploaded_files.storage_path IS 'Path to file in Supabase Storage for management operations';
  END IF;
END $$;

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

-- Add comment to the trigger function
COMMENT ON FUNCTION set_storage_path() IS 'Trigger function to automatically set storage_path and file_url for call-transcripts bucket';