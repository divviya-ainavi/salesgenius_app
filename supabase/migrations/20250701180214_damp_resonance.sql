/*
  # Add location fields to organizations table

  1. New Columns
    - `country` (text) - Country name for the organization
    - `city` (text) - City name for the organization

  2. Changes
    - Add country column to organizations table
    - Add city column to organizations table
    - Both fields are optional (nullable)
*/

-- Add country and city columns to organizations table
DO $$
BEGIN
  -- Add country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'country'
  ) THEN
    ALTER TABLE organizations ADD COLUMN country text;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'city'
  ) THEN
    ALTER TABLE organizations ADD COLUMN city text;
  END IF;
END $$;