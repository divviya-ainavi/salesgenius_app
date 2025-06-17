/*
  # Add otp_verified column to profiles

  1. Schema Update
    - Add otp_verified column to profiles table
    - Set default value to false
    - Update existing demo users to have otp_verified = true
*/

-- Add otp_verified column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'otp_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN otp_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing demo users to have otp_verified = true
UPDATE profiles SET
  otp_verified = true
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);