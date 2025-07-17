/*
  # Add Fireflies Integration Support

  1. New Columns
    - `fireflies_encrypted_token` (text) - Encrypted Fireflies API token
    - `fireflies_connected` (boolean) - Connection status flag

  2. Security
    - No additional RLS policies needed as profiles table already has proper security
*/

-- Add fireflies_encrypted_token column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fireflies_encrypted_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fireflies_encrypted_token text;
  END IF;
END $$;

-- Add fireflies_connected column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fireflies_connected'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fireflies_connected boolean DEFAULT false;
  END IF;
END $$;