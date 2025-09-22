/*
  # Add type field to invites table

  1. Schema Changes
    - Add `type` column to `invites` table
    - `type` (text, nullable) - 'beta' for self-signups, null for admin invites
  
  2. Purpose
    - Distinguish between self-signup (beta) users and admin-invited users
    - Allows for different handling of user types in the application
*/

-- Add type column to invites table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invites' AND column_name = 'type'
  ) THEN
    ALTER TABLE invites ADD COLUMN type text;
  END IF;
END $$;

-- Add comment to explain the column purpose
COMMENT ON COLUMN invites.type IS 'User type: beta for self-signups, null for admin invites';