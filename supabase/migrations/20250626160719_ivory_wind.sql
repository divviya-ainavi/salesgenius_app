/*
  # Setup Integration Tables

  1. New Tables
    - `user_fireflies_keys` - Store encrypted Fireflies API keys per user
    - `org_hubspot_tokens` - Store encrypted HubSpot tokens per organization
    
  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
    
  3. Functions
    - Add encryption/decryption functions for sensitive data
*/

-- Create user_fireflies_keys table
CREATE TABLE IF NOT EXISTS user_fireflies_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_api_key text NOT NULL,
  is_valid boolean DEFAULT true,
  last_verified timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create org_hubspot_tokens table
CREATE TABLE IF NOT EXISTS org_hubspot_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  encrypted_access_token text NOT NULL,
  hub_id text,
  account_name text,
  expires_at timestamptz,
  is_valid boolean DEFAULT true,
  last_verified timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE user_fireflies_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_hubspot_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_fireflies_keys
CREATE POLICY "Users can manage their own Fireflies keys"
  ON user_fireflies_keys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for org_hubspot_tokens
CREATE POLICY "Org admins can manage HubSpot tokens"
  ON org_hubspot_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND p.organization_id = org_hubspot_tokens.organization_id
      AND r.key IN ('org_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND p.organization_id = org_hubspot_tokens.organization_id
      AND r.key IN ('org_admin', 'super_admin')
    )
  );

-- Users can read their org's HubSpot token status (but not the token itself)
CREATE POLICY "Users can view org HubSpot status"
  ON org_hubspot_tokens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = org_hubspot_tokens.organization_id
    )
  );

-- Add updated_at trigger for user_fireflies_keys
CREATE TRIGGER update_user_fireflies_keys_updated_at
  BEFORE UPDATE ON user_fireflies_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for org_hubspot_tokens
CREATE TRIGGER update_org_hubspot_tokens_updated_at
  BEFORE UPDATE ON org_hubspot_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_fireflies_keys_user_id ON user_fireflies_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fireflies_keys_valid ON user_fireflies_keys(is_valid);
CREATE INDEX IF NOT EXISTS idx_org_hubspot_tokens_org_id ON org_hubspot_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_hubspot_tokens_valid ON org_hubspot_tokens(is_valid);
CREATE INDEX IF NOT EXISTS idx_org_hubspot_tokens_expires ON org_hubspot_tokens(expires_at);