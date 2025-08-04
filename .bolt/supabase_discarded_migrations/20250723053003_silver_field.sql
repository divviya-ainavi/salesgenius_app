/*
  # Create business-knowledge storage bucket

  1. Storage Setup
    - Create `business-knowledge` storage bucket
    - Set bucket to private (files accessible via signed URLs)
    - Configure proper access policies

  2. Security
    - Enable RLS on storage objects
    - Add policies for organization-based access
    - Allow authenticated users to upload/download their org files
*/

-- Create the business-knowledge storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-knowledge',
  'business-knowledge', 
  false,
  104857600, -- 100MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'application/json'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to their organization folder
CREATE POLICY "Allow org members to upload business knowledge files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-knowledge' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Allow authenticated users to view files from their organization
CREATE POLICY "Allow org members to view business knowledge files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-knowledge' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Allow org admins to delete business knowledge files
CREATE POLICY "Allow org admins to delete business knowledge files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-knowledge' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM profiles 
    WHERE id = auth.uid() AND title_id IN (
      SELECT id FROM titles WHERE role_id = 2
    )
  )
);