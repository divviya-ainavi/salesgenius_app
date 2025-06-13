/*
  # Storage bucket setup for call transcripts

  This migration sets up the database structure to support file storage.
  The actual storage bucket creation needs to be done through the Supabase dashboard.

  1. Database Structure
     - Ensure uploaded_files table has proper storage support
     - Add indexes for better performance
     - Update RLS policies

  2. Instructions for Manual Setup
     - Create 'call-transcripts' bucket in Supabase dashboard
     - Configure bucket settings: public=true, file_size_limit=52428800
     - Set allowed MIME types in dashboard

  3. Security
     - RLS policies for file access
     - User-specific folder access
*/

-- Ensure the uploaded_files table has the storage_path column
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

-- Add index for storage_path if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'uploaded_files' AND indexname = 'idx_uploaded_files_storage_path'
  ) THEN
    CREATE INDEX idx_uploaded_files_storage_path ON uploaded_files (storage_path);
  END IF;
END $$;

-- Update the uploaded_files table comment
COMMENT ON TABLE uploaded_files IS 'Stores metadata for uploaded call transcripts and related files with Supabase Storage integration';

-- Ensure RLS is enabled on uploaded_files
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for uploaded_files to ensure proper access control
DROP POLICY IF EXISTS "Users can manage own files" ON uploaded_files;
DROP POLICY IF EXISTS "Demo Sales Manager files access" ON uploaded_files;

-- Policy: Users can manage their own files
CREATE POLICY "Users can manage own files" ON uploaded_files
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Demo Sales Manager access for demo purposes
CREATE POLICY "Demo Sales Manager files access" ON uploaded_files
FOR ALL TO public
USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Create a function to generate storage paths
CREATE OR REPLACE FUNCTION generate_storage_path(user_id uuid, filename text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a storage path in the format: user_id/timestamp_filename
  RETURN user_id::text || '/' || extract(epoch from now())::bigint || '_' || filename;
END;
$$;

-- Create a function to get file URL (placeholder for storage integration)
CREATE OR REPLACE FUNCTION get_file_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function will return the public URL for a file
  -- In practice, this would integrate with Supabase Storage
  IF storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return the expected storage URL format
  RETURN 'https://zuuxjfiqhgdrltnkxjtv.supabase.co/storage/v1/object/public/call-transcripts/' || storage_path;
END;
$$;

-- Add trigger to automatically set storage_path on insert if not provided
CREATE OR REPLACE FUNCTION set_storage_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set storage_path if it's not already provided
  IF NEW.storage_path IS NULL AND NEW.filename IS NOT NULL THEN
    NEW.storage_path := generate_storage_path(NEW.user_id, NEW.filename);
  END IF;
  
  -- Set file_url based on storage_path if not provided
  IF NEW.file_url IS NULL AND NEW.storage_path IS NOT NULL THEN
    NEW.file_url := get_file_url(NEW.storage_path);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for uploaded_files
DROP TRIGGER IF EXISTS trigger_set_storage_path ON uploaded_files;
CREATE TRIGGER trigger_set_storage_path
  BEFORE INSERT ON uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION set_storage_path();

-- Add helpful comments
COMMENT ON FUNCTION generate_storage_path(uuid, text) IS 'Generates a unique storage path for uploaded files';
COMMENT ON FUNCTION get_file_url(text) IS 'Returns the public URL for a file stored in Supabase Storage';
COMMENT ON FUNCTION set_storage_path() IS 'Trigger function to automatically set storage_path and file_url on file upload';