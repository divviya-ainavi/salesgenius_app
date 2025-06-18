/*
  # Create Storage Bucket for Call Transcripts

  1. Storage Setup
    - Create call-transcripts bucket with proper configuration
    - Set file size limits and allowed MIME types
    - Enable public access for shareable links

  2. Security Policies
    - Users can manage their own files
    - Public read access for sharing
    - Demo user access for testing
*/

-- Create the storage bucket using the storage schema
SELECT storage.create_bucket('call-transcripts');

-- Update bucket configuration
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800, -- 50MB
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

-- Create storage policies using the storage schema functions

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files  
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access for shareable links
CREATE POLICY "Public read access for shareable links" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'call-transcripts');

-- Policy: Demo Sales Manager access
CREATE POLICY "Demo Sales Manager storage access" ON storage.objects
FOR ALL TO public
USING (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
)
WITH CHECK (
  bucket_id = 'call-transcripts' AND
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000003'
);