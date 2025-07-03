/*
  # Create invites table for user invitation system

  1. New Tables
    - `invites`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `organization_id` (uuid, foreign key to organizations)
      - `title_id` (integer, foreign key to titles)
      - `token` (text, encrypted JWT token)
      - `status` (text, invitation status)
      - `invited_by` (uuid, foreign key to profiles)
      - `invited_at` (timestamp)
      - `expires_at` (timestamp)
      - `accepted_at` (timestamp, nullable)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `invites` table
    - Add policies for authenticated users to manage invites based on their role

  3. Indexes
    - Index on email for fast lookups
    - Index on token for invitation verification
    - Index on status for filtering
    - Index on organization_id for org-specific queries
*/

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title_id integer REFERENCES titles(id) ON DELETE SET NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'completed', 'expired')),
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_organization_id ON invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_at ON invites(invited_at DESC);

-- Create RLS policies
CREATE POLICY "Super admins can manage all invites"
  ON invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.title_id IS NULL
    )
  );

CREATE POLICY "Org admins can manage their organization invites"
  ON invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.key = 'org_admin'
      AND (invites.organization_id = p.organization_id OR invites.organization_id IS NULL)
    )
  );

CREATE POLICY "Users can view their own invites"
  ON invites
  FOR SELECT
  TO public
  USING (
    invites.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invites_updated_at();