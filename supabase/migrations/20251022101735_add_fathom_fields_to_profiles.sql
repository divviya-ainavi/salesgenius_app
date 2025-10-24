/*
  # Add Fathom Integration Fields to Profiles

  1. Changes
    - Add `fathom_encrypted_token` column to profiles table for storing encrypted Fathom API token
    - Add `fathom_connected` column to profiles table for tracking Fathom connection status
  
  2. Details
    - `fathom_encrypted_token` (text, nullable) - Stores the encrypted JWT token for Fathom API
    - `fathom_connected` (boolean, default false) - Indicates whether user has connected their Fathom account
*/

-- Add fathom_encrypted_token column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fathom_encrypted_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fathom_encrypted_token text;
  END IF;
END $$;

-- Add fathom_connected column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fathom_connected'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fathom_connected boolean DEFAULT false;
  END IF;
END $$;
