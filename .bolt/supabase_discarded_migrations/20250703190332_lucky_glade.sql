/*
  # Update invites table with status column

  1. Changes
    - Add status column to track invite lifecycle
    - Add updated_at column for tracking changes
    - Create index for performance
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add proper indexes for performance
*/

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invites' AND column_name = 'status'
  ) THEN
    ALTER TABLE invites ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired'));
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invites' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add token column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invites' AND column_name = 'token'
  ) THEN
    ALTER TABLE invites ADD COLUMN token text;
  END IF;
END $$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_invites_updated_at_trigger ON invites;
CREATE TRIGGER update_invites_updated_at_trigger
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invites_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_email_status ON invites(email, status);
CREATE INDEX IF NOT EXISTS idx_invites_updated_at ON invites(updated_at);