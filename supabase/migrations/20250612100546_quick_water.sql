/*
  # Create Demo Sales Manager User Profile

  1. New Data
    - Insert demo Sales Manager profile if it doesn't exist
    - Ensures the user ID referenced in policies actually exists in the database

  2. Security
    - Uses the same UUID as defined in the RLS policies
    - Sets up complete user profile for testing
*/

-- Insert demo Sales Manager profile if it doesn't exist
INSERT INTO profiles (
  id,
  email,
  created_at,
  updated_at,
  otp_verified,
  hubspot_connected
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'sales.manager@company.com',
  now(),
  now(),
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Also insert demo Super Admin and Org Admin for future use
INSERT INTO profiles (
  id,
  email,
  created_at,
  updated_at,
  otp_verified,
  hubspot_connected
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'super.admin@company.com',
  now(),
  now(),
  true,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  email,
  created_at,
  updated_at,
  otp_verified,
  hubspot_connected
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'org.admin@company.com',
  now(),
  now(),
  true,
  true
) ON CONFLICT (id) DO NOTHING;