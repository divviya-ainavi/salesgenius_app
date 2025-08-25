/*
  # Add HubSpot Integration Fields

  1. Schema Updates
    - Add `hubspot_company_id` and `is_hubspot` fields to `company` table
    - Add `hubspot_deal_id` and `is_hubspot` fields to `prospect` table
    - Add indexes for performance on HubSpot ID fields
    - Add unique constraints to prevent duplicate HubSpot records

  2. Data Integrity
    - Ensure HubSpot IDs are unique within each organization
    - Add proper constraints and validation
*/

-- Add HubSpot fields to company table
DO $$
BEGIN
  -- Add hubspot_company_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_company_id'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_company_id text;
  END IF;

  -- Add is_hubspot column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'is_hubspot'
  ) THEN
    ALTER TABLE company ADD COLUMN is_hubspot boolean DEFAULT false;
  END IF;

  -- Add hubspot_created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_created_at'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_created_at timestamptz;
  END IF;

  -- Add hubspot_updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_updated_at'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_updated_at timestamptz;
  END IF;

  -- Add hubspot_owner_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_owner_id'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_owner_id text;
  END IF;

  -- Add domain column if it doesn't exist (for HubSpot company domain)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'domain'
  ) THEN
    ALTER TABLE company ADD COLUMN domain text;
  END IF;

  -- Add industry column if it doesn't exist (for HubSpot company industry)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'industry'
  ) THEN
    ALTER TABLE company ADD COLUMN industry text;
  END IF;

  -- Add city column if it doesn't exist (for HubSpot company city)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'city'
  ) THEN
    ALTER TABLE company ADD COLUMN city text;
  END IF;
END $$;

-- Add HubSpot fields to prospect table
DO $$
BEGIN
  -- Add hubspot_deal_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_deal_id'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_deal_id text;
  END IF;

  -- Add is_hubspot column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'is_hubspot'
  ) THEN
    ALTER TABLE prospect ADD COLUMN is_hubspot boolean DEFAULT false;
  END IF;

  -- Add hubspot_created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_created_at'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_created_at timestamptz;
  END IF;

  -- Add hubspot_updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_updated_at'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_updated_at timestamptz;
  END IF;

  -- Add hubspot_owner_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_owner_id'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_owner_id text;
  END IF;

  -- Add amount column if it doesn't exist (for HubSpot deal amount)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'amount'
  ) THEN
    ALTER TABLE prospect ADD COLUMN amount numeric;
  END IF;

  -- Add close_date column if it doesn't exist (for HubSpot deal close date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'close_date'
  ) THEN
    ALTER TABLE prospect ADD COLUMN close_date timestamptz;
  END IF;

  -- Add deal_stage column if it doesn't exist (for HubSpot deal stage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'deal_stage'
  ) THEN
    ALTER TABLE prospect ADD COLUMN deal_stage text;
  END IF;
END $$;

-- Create indexes for better performance on HubSpot ID lookups
CREATE INDEX IF NOT EXISTS idx_company_hubspot_company_id 
ON company(hubspot_company_id) 
WHERE hubspot_company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_is_hubspot 
ON company(is_hubspot) 
WHERE is_hubspot = true;

CREATE INDEX IF NOT EXISTS idx_prospect_hubspot_deal_id 
ON prospect(hubspot_deal_id) 
WHERE hubspot_deal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_is_hubspot 
ON prospect(is_hubspot) 
WHERE is_hubspot = true;

-- Create unique constraints to prevent duplicate HubSpot records within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_unique_hubspot_per_org
ON company(organization_id, hubspot_company_id)
WHERE hubspot_company_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_unique_hubspot_per_company
ON prospect(company_id, hubspot_deal_id)
WHERE hubspot_deal_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN company.hubspot_company_id IS 'HubSpot company ID for synced companies';
COMMENT ON COLUMN company.is_hubspot IS 'Flag indicating if this company was synced from HubSpot';
COMMENT ON COLUMN company.hubspot_created_at IS 'Creation date from HubSpot';
COMMENT ON COLUMN company.hubspot_updated_at IS 'Last modified date from HubSpot';
COMMENT ON COLUMN company.hubspot_owner_id IS 'HubSpot owner ID for this company';

COMMENT ON COLUMN prospect.hubspot_deal_id IS 'HubSpot deal ID for synced deals';
COMMENT ON COLUMN prospect.is_hubspot IS 'Flag indicating if this prospect was synced from HubSpot';
COMMENT ON COLUMN prospect.hubspot_created_at IS 'Creation date from HubSpot';
COMMENT ON COLUMN prospect.hubspot_updated_at IS 'Last modified date from HubSpot';
COMMENT ON COLUMN prospect.hubspot_owner_id IS 'HubSpot owner ID for this deal';
COMMENT ON COLUMN prospect.amount IS 'Deal amount from HubSpot';
COMMENT ON COLUMN prospect.close_date IS 'Expected close date from HubSpot';
COMMENT ON COLUMN prospect.deal_stage IS 'Deal stage from HubSpot';