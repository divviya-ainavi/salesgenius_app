/*
  # Add organization plan fields to plan_master

  1. Changes
    - Add `is_organization_plan` (boolean) - Flag to identify organization plans
    - Add `price_per_user` (numeric) - Price per user for organization plans
    - Add `minimum_users` (integer) - Minimum users required for organization plan
    - Add `features` (text array) - List of features for the plan

  2. Security
    - No changes to RLS policies

  3. Important Notes
    - is_organization_plan: true for organization/team plans, false for individual plans
    - price_per_user: Per-user pricing for organization plans
    - minimum_users: Default is 2 for organization plans
*/

-- Add new columns to plan_master
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_master' AND column_name = 'is_organization_plan'
  ) THEN
    ALTER TABLE plan_master ADD COLUMN is_organization_plan boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_master' AND column_name = 'price_per_user'
  ) THEN
    ALTER TABLE plan_master ADD COLUMN price_per_user numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_master' AND column_name = 'minimum_users'
  ) THEN
    ALTER TABLE plan_master ADD COLUMN minimum_users integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_master' AND column_name = 'features'
  ) THEN
    ALTER TABLE plan_master ADD COLUMN features text[];
  END IF;
END $$;

-- Update existing individual plans
UPDATE plan_master
SET is_organization_plan = false,
    minimum_users = 1
WHERE is_organization_plan IS NULL OR is_organization_plan = false;
