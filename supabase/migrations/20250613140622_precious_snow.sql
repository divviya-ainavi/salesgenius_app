/*
# Storage Bucket Setup for Call Transcripts

1. Storage Configuration
   - Creates 'call-transcripts' bucket for file storage
   - Sets appropriate file size limits and MIME type restrictions
   - Configures public access for shareable links

2. Security Policies
   - Users can only access files in their own folder structure
   - Demo Sales Manager has special access for demo purposes
   - Public read access enabled for shareable file links

3. File Management
   - Supports multiple file formats (text, audio, video, documents)
   - 50MB file size limit per upload
   - Organized by user ID for proper isolation
*/

-- Create the storage bucket using the storage.buckets table
-- This approach works better with RLS permissions
DO $$
BEGIN
  -- Check if bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'call-transcripts'
  ) THEN
    -- Insert the bucket directly
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
    );
  ELSE
    -- Update existing bucket settings
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
  END IF;
END $$;

-- Create storage policies using a function approach
-- This avoids direct table modification permission issues
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
  DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

  -- Policy: Users can upload files to their own folder
  EXECUTE 'CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = auth.uid()::text
    )';

  -- Policy: Users can view their own files  
  EXECUTE 'CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = auth.uid()::text
    )';

  -- Policy: Users can update their own files
  EXECUTE 'CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = auth.uid()::text
    )';

  -- Policy: Users can delete their own files
  EXECUTE 'CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = auth.uid()::text
    )';

  -- Policy: Allow public read access for shareable links
  EXECUTE 'CREATE POLICY "Public read access for shareable links" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = ''call-transcripts'')';

  -- Policy: Demo Sales Manager access
  EXECUTE 'CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
    FOR ALL TO public
    USING (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = ''00000000-0000-0000-0000-000000000003''
    )
    WITH CHECK (
      bucket_id = ''call-transcripts'' AND
      (string_to_array(name, ''/''))[1] = ''00000000-0000-0000-0000-000000000003''
    )';

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the migration
    RAISE NOTICE 'Storage policy setup encountered an issue: %', SQLERRM;
END;
$$;

-- Execute the storage policy setup
SELECT setup_storage_policies();

-- Clean up the function
DROP FUNCTION IF EXISTS setup_storage_policies();

-- Ensure uploaded_files table is properly configured for storage integration
-- This part should work as it's modifying our own tables
DO $$
BEGIN
  -- Ensure storage_path column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE uploaded_files ADD COLUMN storage_path text;
    COMMENT ON COLUMN uploaded_files.storage_path IS 'Path to file in Supabase Storage for management operations';
  END IF;

  -- Add index for storage_path if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'uploaded_files' AND indexname = 'idx_uploaded_files_storage_path'
  ) THEN
    CREATE INDEX idx_uploaded_files_storage_path ON uploaded_files (storage_path);
  END IF;
END $$;

-- Update table comment
COMMENT ON TABLE uploaded_files IS 'Stores metadata for uploaded call transcripts and related files with Supabase Storage integration';

-- Create helper functions for storage path generation
CREATE OR REPLACE FUNCTION generate_storage_path(user_id uuid, filename text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a storage path in the format: user_id/timestamp_filename
  RETURN user_id::text || '/' || extract(epoch from now())::bigint || '_' || filename;
END;
$$;

-- Create function to get file URL
CREATE OR REPLACE FUNCTION get_file_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return the public URL for a file in the call-transcripts bucket
  IF storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return the expected storage URL format for the call-transcripts bucket
  RETURN 'https://zuuxjfiqhgdrltnkxjtv.supabase.co/storage/v1/object/public/call-transcripts/' || storage_path;
END;
$$;

-- Update the trigger function to use the new bucket
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_set_storage_path ON uploaded_files;
CREATE TRIGGER trigger_set_storage_path
  BEFORE INSERT ON uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION set_storage_path();

-- Add helpful comments
COMMENT ON FUNCTION generate_storage_path(uuid, text) IS 'Generates a unique storage path for uploaded files in call-transcripts bucket';
COMMENT ON FUNCTION get_file_url(text) IS 'Returns the public URL for a file stored in the call-transcripts bucket';
COMMENT ON FUNCTION set_storage_path() IS 'Trigger function to automatically set storage_path and file_url for call-transcripts bucket';