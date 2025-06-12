-- Update storage policies to use the existing transcript-files bucket

-- Drop existing policies for call-transcripts bucket
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shareable links" ON storage.objects;
DROP POLICY IF EXISTS "Demo Sales Manager storage access" ON storage.objects;

-- Policy: Users can upload files to their own folder in transcript-files bucket
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files in transcript-files bucket
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files in transcript-files bucket
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files in transcript-files bucket
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'transcript-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access for shareable links in transcript-files bucket
CREATE POLICY "Public read access for shareable links" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'transcript-files');

-- Policy: Demo Sales Manager access to transcript-files bucket
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