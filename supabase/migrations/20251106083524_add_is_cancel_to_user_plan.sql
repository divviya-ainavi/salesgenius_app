/*
  # Add is_cancel field to user_plan table

  1. Changes
    - Add `is_cancel` column to `user_plan` table
      - Type: boolean
      - Default value: false
      - Purpose: Track whether a user plan has been canceled
  
  2. Notes
    - Using IF NOT EXISTS to prevent errors if column already exists
    - Safe migration that won't affect existing data
    - All existing records will have is_cancel = false by default
*/

-- Add is_cancel column to user_plan table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'is_cancel'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN is_cancel boolean DEFAULT false;
  END IF;
END $$;
