/*
  # Business Knowledge Files System

  1. New Tables
    - `business_knowledge_files`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `uploaded_by` (uuid, foreign key to profiles)
      - `filename` (text)
      - `original_filename` (text)
      - `file_size` (bigint)
      - `content_type` (text)
      - `storage_path` (text)
      - `file_url` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `business_knowledge_files` table
    - Add policies for org admins to manage files
    - Add policies for organization members to read files
    - Add storage bucket policies

  3. Storage
    - Create business-knowledge storage bucket
    - Set up proper RLS policies for file access
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Org admins can manage business knowledge files" ON business_knowledge_files;
DROP POLICY IF EXISTS "Organization members can read business knowledge files" ON business_knowledge_files;
DROP POLICY IF EXISTS "Org admins can upload business knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete business knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can view business knowledge files" ON storage.objects;

-- Create storage bucket for business knowledge files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'business-knowledge') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'business-knowledge',
      'business-knowledge',
      false,
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
    );
  END IF;
END $$;

-- Create business knowledge files table if it doesn't exist
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

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_org_id ON business_knowledge_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_uploaded_by ON business_knowledge_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_created_at ON business_knowledge_files(created_at DESC);

-- Enable RLS on the table
ALTER TABLE business_knowledge_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org admins can manage business knowledge files
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

-- RLS Policy: Organization members can read business knowledge files
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

-- Storage RLS Policies
-- Policy for org admins to upload/delete files
CREATE POLICY "Org admins can upload business knowledge files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-knowledge' AND
    (storage.foldername(name))[1] IN (
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

CREATE POLICY "Org admins can delete business knowledge files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-knowledge' AND
    (storage.foldername(name))[1] IN (
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

-- Policy for organization members to view files
CREATE POLICY "Organization members can view business knowledge files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-knowledge' AND
    (storage.foldername(name))[1] IN (
      SELECT profiles.organization_id::text
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  );

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_business_knowledge_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_business_knowledge_files_updated_at ON business_knowledge_files;
CREATE TRIGGER update_business_knowledge_files_updated_at
  BEFORE UPDATE ON business_knowledge_files
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_files_updated_at();