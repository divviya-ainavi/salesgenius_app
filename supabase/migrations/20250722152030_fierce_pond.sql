/*
  # Business Knowledge Files Table

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
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `business_knowledge_files` table
    - Add policies for org admins to manage files within their organization
    - Add policies for organization members to read files

  3. Storage
    - Files will be stored in Supabase Storage bucket 'business-knowledge'
*/

-- Create the business_knowledge_files table
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

-- Enable RLS
ALTER TABLE business_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Org admins can manage all files in their organization
CREATE POLICY "Org admins can manage business knowledge files"
  ON business_knowledge_files
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND title_id IN (
        SELECT id 
        FROM titles 
        WHERE role_id = 2 -- Org Admin role
      )
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND title_id IN (
        SELECT id 
        FROM titles 
        WHERE role_id = 2 -- Org Admin role
      )
    )
  );

-- Organization members can read files in their organization
CREATE POLICY "Organization members can read business knowledge files"
  ON business_knowledge_files
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_org_id 
  ON business_knowledge_files(organization_id);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_uploaded_by 
  ON business_knowledge_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_created_at 
  ON business_knowledge_files(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_business_knowledge_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_knowledge_files_updated_at
  BEFORE UPDATE ON business_knowledge_files
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_files_updated_at();