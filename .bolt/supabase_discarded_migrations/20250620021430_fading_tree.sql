/*
  # Add HubSpot token expiry field to profiles table

  1. Schema Updates
    - Add hubspot_token_expires_at column to profiles table
    - Add indexes for better query performance
    - Update existing demo users with proper HubSpot connection status

  2. Security
    - Maintain existing RLS policies
    - Ensure token expiry is properly tracked
*/

-- Add hubspot_token_expires_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hubspot_token_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hubspot_token_expires_at timestamptz;
  END IF;
END $$;

-- Add otp_code and otp_expires_at columns for OTP verification if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'otp_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN otp_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'otp_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN otp_expires_at timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_otp ON profiles(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_profiles_otp_expires ON profiles(otp_expires_at);

-- Update existing demo users with proper HubSpot connection status
UPDATE profiles SET
  hubspot_connected = true,
  hubspot_token_expires_at = now() + interval '1 hour'
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- Add comment for the new column
COMMENT ON COLUMN profiles.hubspot_token_expires_at IS 'Timestamp when the HubSpot access token expires';