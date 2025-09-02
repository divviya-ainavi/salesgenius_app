/*
  # Add others field to business_knowledge_org table

  1. Schema Changes
    - Add `others` JSONB field to store additional data from file upload API
    - Field will store array of objects with title and content properties

  2. Security
    - No changes to existing RLS policies needed
    - Field inherits existing security model
*/

-- Add others field to business_knowledge_org table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_knowledge_org' AND column_name = 'others'
  ) THEN
    ALTER TABLE business_knowledge_org ADD COLUMN others JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add comment to document the field
COMMENT ON COLUMN business_knowledge_org.others IS 'Additional data from file upload API response containing title and content pairs';