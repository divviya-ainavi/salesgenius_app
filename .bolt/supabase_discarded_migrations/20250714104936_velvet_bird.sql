/*
  # Add is_active field to action_items table

  1. Changes
    - Add is_active boolean column to action_items table with default value true
    - Update existing records to set is_active to true
    - Add index on is_active column for better query performance
*/

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE action_items ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update all existing records to have is_active = true
UPDATE action_items SET is_active = true WHERE is_active IS NULL;

-- Create index on is_active column for better query performance
CREATE INDEX IF NOT EXISTS idx_action_items_is_active ON action_items(is_active);