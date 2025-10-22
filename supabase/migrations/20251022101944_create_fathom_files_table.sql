/*
  # Create Fathom Files Table

  1. New Tables
    - `fathom_files`
      - `id` (bigint, primary key) - Auto-incrementing primary key
      - `created_at` (timestamptz, default now()) - Timestamp when record was created
      - `title` (text, nullable) - Meeting title
      - `organizer_email` (text, nullable) - Email of meeting organizer
      - `participants` (jsonb, nullable) - Array of participant emails
      - `meeting_link` (text, nullable) - Link to the meeting
      - `datestring` (timestamptz, nullable) - Meeting date and time
      - `is_processed` (boolean, default false) - Whether the file has been processed
      - `fathom_id` (text, nullable, unique) - Unique identifier from Fathom
      - `user_id` (uuid, nullable) - Reference to profiles table
      - `duration` (integer, nullable) - Meeting duration in seconds
      - `summary` (jsonb, nullable) - Meeting summary data
      - `sentences` (jsonb, nullable) - Transcript sentences data

  2. Security
    - Enable RLS on `fathom_files` table
    - Add policy for super admin to access all files
    - Add policy for org admin to access their organization users' files
    - Add policy for users to access their own files

  3. Indexes
    - Unique index on `fathom_id`
    - Primary key index on `id`
*/

-- Create fathom_files table
CREATE TABLE IF NOT EXISTS fathom_files (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text,
  organizer_email text,
  participants jsonb,
  meeting_link text,
  datestring timestamptz,
  is_processed boolean DEFAULT false,
  fathom_id text UNIQUE,
  user_id uuid,
  duration integer,
  summary jsonb,
  sentences jsonb
);

-- Add foreign key constraint to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fathom_files_user_id_fkey'
    AND table_name = 'fathom_files'
  ) THEN
    ALTER TABLE fathom_files
    ADD CONSTRAINT fathom_files_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fathom_files ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin full access
CREATE POLICY "super admin full access"
  ON fathom_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

-- Policy: Org admin access to org users' files
CREATE POLICY "org admin access to org users' files"
  ON fathom_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1
        FROM profiles data_owner
        WHERE data_owner.id = fathom_files.user_id
        AND data_owner.organization_id = p.organization_id
      )
    )
  );

-- Policy: User access to their own files
CREATE POLICY "user access to their own files"
  ON fathom_files
  FOR ALL
  TO authenticated
  USING (
    user_id = (
      SELECT id
      FROM profiles
      WHERE auth_user_id = auth.uid()
    )
  );
