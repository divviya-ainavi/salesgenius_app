/*
  # Add foreign key relationship between call_insights and uploaded_files

  1. Database Changes
    - Add uploaded_file_id column to call_insights table if it doesn't exist
    - Add foreign key constraint linking call_insights.uploaded_file_id to uploaded_files.id
    - Add index for better query performance

  2. Security
    - No RLS changes needed as existing policies will handle access control

  This migration fixes the relationship error when querying call_insights with uploaded_files data.
*/

-- Add uploaded_file_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_insights' AND column_name = 'uploaded_file_id'
  ) THEN
    ALTER TABLE call_insights ADD COLUMN uploaded_file_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'call_insights_uploaded_file_id_fkey'
  ) THEN
    ALTER TABLE call_insights 
    ADD CONSTRAINT call_insights_uploaded_file_id_fkey 
    FOREIGN KEY (uploaded_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_call_insights_uploaded_file_id'
  ) THEN
    CREATE INDEX idx_call_insights_uploaded_file_id ON call_insights(uploaded_file_id);
  END IF;
END $$;