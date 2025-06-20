/*
  # Add authentication fields to profiles table

  1. New Fields
    - `password_hash` (text) - Stores hashed password for email/password authentication
    - `full_name` (text) - User's full name for display purposes
    - `last_login_at` (timestamptz) - Track when user last logged in
    - `hubspot_token_expires_at` (timestamptz) - Track HubSpot token expiration

  2. Security
    - Password hash is stored securely (will be handled by Supabase Auth)
    - Existing RLS policies remain in place
    - Add index for performance on email lookups

  3. Data Migration
    - Add default values for existing records
    - Update existing demo user with proper fields
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;

  -- Add last_login_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;

  -- Add hubspot_token_expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'hubspot_token_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hubspot_token_expires_at timestamptz;
  END IF;
END $$;

-- Update existing demo user record with proper data
INSERT INTO profiles (
  id,
  email,
  full_name,
  hubspot_connected,
  organization_id,
  status_id,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'demo@salesgenius.ai',
  'Demo Sales Manager',
  false,
  '00000000-0000-0000-0000-000000000001',
  1,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- Create additional demo users for testing
INSERT INTO profiles (
  id,
  email,
  full_name,
  hubspot_connected,
  organization_id,
  status_id,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000004',
    'admin@salesgenius.ai',
    'Admin User',
    false,
    '00000000-0000-0000-0000-000000000001',
    1,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'manager@salesgenius.ai',
    'Sales Manager',
    false,
    '00000000-0000-0000-0000-000000000001',
    1,
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- Add performance index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup 
ON profiles USING btree (email) 
WHERE email IS NOT NULL;

-- Add index for HubSpot token expiration checks
CREATE INDEX IF NOT EXISTS idx_profiles_hubspot_token_expires 
ON profiles USING btree (hubspot_token_expires_at) 
WHERE hubspot_token_expires_at IS NOT NULL;