/*
  # Create Storage Bucket for Call Transcripts

  1. Storage Setup
    - Create 'call-transcripts' bucket for file uploads
    - Configure bucket as public for shareable links
    - Set up RLS policies for secure access

  2. Security
    - Enable RLS on storage bucket
    - Allow authenticated users to upload their own files
    - Allow public read access for shareable links
    - Demo user access for testing
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-transcripts',
  'call-transcripts', 
  true,
  52428800, -- 50MB limit
  ARRAY['text/plain', 'application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: Allow public read access for shareable links
CREATE POLICY "Public read access for shareable links"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'call-transcripts');

-- Policy: Demo Sales Manager access
CREATE POLICY "Demo Sales Manager storage access"
ON storage.objects
FOR ALL
TO public
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
)
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
);