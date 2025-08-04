/*
  # Fix Business Knowledge Storage System

  1. Storage Bucket
    - Create business-knowledge bucket if not exists
    - Set up proper RLS policies for file access
    - Configure file size and type restrictions

  2. Database Table
    - Ensure business_knowledge_files table exists with correct structure
    - Set up proper RLS policies for organization isolation
    - Add proper indexes and foreign keys

  3. Security
    - Org admins can upload/delete files for their organization
    - Organization members can view files from their organization
    - Proper file access controls
*/

-- Create storage bucket for business knowledge files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-knowledge',
  'business-knowledge',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

-- Create business_knowledge_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  storage_path text NOT NULL,
  file_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_org_id 
ON business_knowledge_files(organization_id);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_uploaded_by 
ON business_knowledge_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_created_at 
ON business_knowledge_files(created_at DESC);

-- Enable RLS on business_knowledge_files table
ALTER TABLE business_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can read business knowledge files" ON business_knowledge_files;
DROP POLICY IF EXISTS "Org admins can manage business knowledge files" ON business_knowledge_files;

-- RLS Policy: Organization members can read files from their organization
CREATE POLICY "Organization members can read business knowledge files"
ON business_knowledge_files
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- RLS Policy: Org admins can manage (insert, update, delete) files for their organization
CREATE POLICY "Org admins can manage business knowledge files"
ON business_knowledge_files
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.title_id IN (
      SELECT titles.id 
      FROM titles 
      WHERE titles.role_id = 2
    )
  )
)
WITH CHECK (
  organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.title_id IN (
      SELECT titles.id 
      FROM titles 
      WHERE titles.role_id = 2
    )
  )
);

-- Storage RLS Policies for business-knowledge bucket
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Organization members can view business knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload business knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete business knowledge files" ON storage.objects;

-- Policy: Organization members can view files from their organization
CREATE POLICY "Organization members can view business knowledge files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-knowledge' 
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.organization_id::text 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policy: Org admins can upload files to their organization folder
CREATE POLICY "Org admins can upload business knowledge files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-knowledge' 
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.organization_id::text 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.title_id IN (
      SELECT titles.id 
      FROM titles 
      WHERE titles.role_id = 2
    )
  )
);

-- Policy: Org admins can delete files from their organization folder
CREATE POLICY "Org admins can delete business knowledge files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-knowledge' 
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.organization_id::text 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.title_id IN (
      SELECT titles.id 
      FROM titles 
      WHERE titles.role_id = 2
    )
  )
);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_knowledge_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_business_knowledge_files_updated_at ON business_knowledge_files;
CREATE TRIGGER update_business_knowledge_files_updated_at
  BEFORE UPDATE ON business_knowledge_files
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_files_updated_at();