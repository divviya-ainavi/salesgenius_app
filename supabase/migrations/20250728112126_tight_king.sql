/*
  # Add password reset functionality to profiles table

  1. New Columns
    - `reset_token` (text) - Stores encrypted reset token
    - `reset_token_expires` (timestamptz) - Token expiration timestamp

  2. Security
    - Tokens are encrypted and time-limited
    - Single-use tokens (cleared after use)
    - Secure token generation with user context

  3. Changes
    - Add reset_token column for storing encrypted tokens
    - Add reset_token_expires for token expiration
    - Tokens are nullable and cleared after use
*/

-- Add password reset fields to profiles table
DO $$
BEGIN
  -- Add reset_token column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reset_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reset_token text;
  END IF;

  -- Add reset_token_expires column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reset_token_expires'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reset_token_expires timestamptz;
  END IF;
END $$;

-- Add index for reset token lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token 
ON profiles(reset_token) 
WHERE reset_token IS NOT NULL;

-- Add index for token expiration cleanup
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expires 
ON profiles(reset_token_expires) 
WHERE reset_token_expires IS NOT NULL;