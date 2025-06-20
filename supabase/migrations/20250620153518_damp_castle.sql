/*
  # Fix RLS policies for file uploads

  1. Storage Policies
    - Add policy for authenticated users to insert files in call-transcripts bucket
    - Add policy for authenticated users to select files in call-transcripts bucket
    - Add policy for authenticated users to update files in call-transcripts bucket
    - Add policy for authenticated users to delete files in call-transcripts bucket

  2. Table Policies
    - Ensure uploaded_files table has proper INSERT policy for authenticated users
    - Ensure uploaded_files table has proper SELECT policy for authenticated users
    - Ensure uploaded_files table has proper UPDATE policy for authenticated users
    - Ensure uploaded_files table has proper DELETE policy for authenticated users

  3. Security
    - All policies restrict access to user's own files only
    - Uses auth.uid() to match user_id
*/

-- Storage policies for call-transcripts bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-transcripts', 'call-transcripts', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- Create storage policies for call-transcripts bucket
CREATE POLICY "Authenticated users can insert files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can select own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Drop existing table policies that might conflict
DROP POLICY IF EXISTS "Allow all authenticated users full access" ON uploaded_files;

-- Create comprehensive RLS policies for uploaded_files table
CREATE POLICY "Users can insert own files"
ON uploaded_files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own files"
ON uploaded_files FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
ON uploaded_files FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
ON uploaded_files FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled on uploaded_files table
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;