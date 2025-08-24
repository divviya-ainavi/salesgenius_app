/*
  # Add sales_insight_ids field to prospect table

  1. Schema Changes
    - Add `sales_insight_ids` column to `prospect` table
    - Type: uuid[] (array of UUIDs)
    - Default: NULL
    - Nullable: true

  2. Purpose
    - Store references to related sales insights for each prospect
    - Enable linking prospects to multiple sales insights
    - Support enhanced prospect analytics and reporting
*/

-- Add sales_insight_ids column to prospect table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'sales_insight_ids'
  ) THEN
    ALTER TABLE prospect ADD COLUMN sales_insight_ids uuid[];
  END IF;
END $$;

-- Add index for better query performance on sales_insight_ids
CREATE INDEX IF NOT EXISTS idx_prospect_sales_insight_ids 
ON prospect USING gin (sales_insight_ids);

-- Add comment to document the column purpose
COMMENT ON COLUMN prospect.sales_insight_ids IS 'Array of UUIDs referencing related sales insights for this prospect';