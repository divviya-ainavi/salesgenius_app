/*
  # Fix personal_knowledge bucket public access policies

  1. Storage Bucket Updates
    - Ensure personal_knowledge bucket has proper public access configuration
    - Update RLS policies for public file access
    - Fix any permission issues with public URLs

  2. Security Policies
    - Allow public read access for file URLs
    - Maintain user-based upload/delete permissions
    - Ensure proper folder-based security
*/

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personal_knowledge',
  'personal_knowledge',
  true,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can upload personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Org admin can access org users personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can access all personal knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for personal knowledge files" ON storage.objects;

-- Create comprehensive RLS policies for personal_knowledge bucket
CREATE POLICY "Users can upload personal knowledge files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'personal_knowledge' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access for personal knowledge files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'personal_knowledge');

CREATE POLICY "Users can view own personal knowledge files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'personal_knowledge' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own personal knowledge files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'personal_knowledge' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own personal knowledge files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'personal_knowledge' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Org admin can access org users personal knowledge files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'personal_knowledge' AND
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.auth_user_id::text = (storage.foldername(name))[1]
        AND p2.organization_id = p1.organization_id
      )
    )
  );

CREATE POLICY "Super admin can access all personal knowledge files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'personal_knowledge' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );