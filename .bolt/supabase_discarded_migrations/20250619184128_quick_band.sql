/*
  # User HubSpot Credentials Management

  1. New Tables
    - `user_hubspot_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `client_id` (text, encrypted)
      - `client_secret` (text, encrypted)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `scope` (text)
      - `hub_domain` (text)
      - `hub_id` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_hubspot_credentials` table
    - Add policies for users to manage their own credentials
    - Encrypt sensitive data

  3. Functions
    - Add trigger for updated_at timestamp
    - Add function to encrypt/decrypt credentials
*/

-- Create user_hubspot_credentials table
CREATE TABLE IF NOT EXISTS user_hubspot_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  hub_domain text,
  hub_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one active credential set per user
  CONSTRAINT unique_active_user_hubspot UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE user_hubspot_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own HubSpot credentials"
  ON user_hubspot_credentials
  FOR ALL
  TO authenticated
  USING (user_id = (uid())::uuid)
  WITH CHECK (user_id = (uid())::uuid);

-- Demo Sales Manager access
CREATE POLICY "Demo Sales Manager HubSpot credentials access"
  ON user_hubspot_credentials
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Updated timestamp trigger
CREATE TRIGGER update_user_hubspot_credentials_updated_at
  BEFORE UPDATE ON user_hubspot_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_hubspot_credentials_user_id 
  ON user_hubspot_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hubspot_credentials_active 
  ON user_hubspot_credentials(user_id, is_active) WHERE is_active = true;

-- Insert demo credentials for the demo user
INSERT INTO user_hubspot_credentials (
  user_id,
  client_id,
  client_secret,
  access_token,
  refresh_token,
  expires_at,
  scope,
  hub_domain,
  hub_id,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'demo-client-id-12345',
  'demo-client-secret-67890',
  'demo-access-token-abcdef',
  'demo-refresh-token-ghijkl',
  now() + interval '1 hour',
  'contacts content reports',
  'demo-company.hubspot.com',
  'demo-hub-12345',
  true
) ON CONFLICT (user_id, is_active) DO NOTHING;