/*
  # Create HubSpot Users Table

  1. New Tables
    - `hubspot_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `organization_id` (uuid, foreign key to organizations)
      - `hubspot_user_id` (text, HubSpot user ID)
      - `email` (text, HubSpot user email)
      - `first_name` (text)
      - `last_name` (text)
      - `hubspot_type` (text, e.g., 'PERSON')
      - `hubspot_created_at` (timestamp)
      - `hubspot_updated_at` (timestamp)
      - `is_archived` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `hubspot_users` table
    - Add policies for org admin and super admin access
    - Add policy for users to read their own data

  3. Indexes
    - Index on organization_id for performance
    - Index on email for lookups
    - Index on hubspot_user_id for uniqueness
*/

CREATE TABLE IF NOT EXISTS hubspot_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hubspot_user_id text NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  hubspot_type text DEFAULT 'PERSON',
  hubspot_created_at timestamptz,
  hubspot_updated_at timestamptz,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, hubspot_user_id)
);

-- Enable RLS
ALTER TABLE hubspot_users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hubspot_users_organization_id ON hubspot_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_users_email ON hubspot_users(email);
CREATE INDEX IF NOT EXISTS idx_hubspot_users_user_id ON hubspot_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_users_hubspot_user_id ON hubspot_users(hubspot_user_id);

-- RLS Policies
CREATE POLICY "Super admin full access to hubspot_users"
  ON hubspot_users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

CREATE POLICY "Org admin access to org hubspot_users"
  ON hubspot_users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND p.organization_id = hubspot_users.organization_id
    )
  );

CREATE POLICY "Users can read their own hubspot_users data"
  ON hubspot_users
  FOR SELECT
  TO public
  USING (
    user_id = (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hubspot_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hubspot_users_updated_at
  BEFORE UPDATE ON hubspot_users
  FOR EACH ROW
  EXECUTE FUNCTION update_hubspot_users_updated_at();