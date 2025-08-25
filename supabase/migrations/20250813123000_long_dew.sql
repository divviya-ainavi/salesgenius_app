/*
  # Add HubSpot Integration Fields to Company and Prospect Tables

  1. Company Table Updates
    - `hubspot_company_id` (text, nullable) - HubSpot company ID for synced companies
    - `is_hubspot` (boolean, default false) - Flag indicating if company was synced from HubSpot
    - `hubspot_created_at` (timestamptz, nullable) - Creation date from HubSpot
    - `hubspot_updated_at` (timestamptz, nullable) - Last modified date from HubSpot
    - `hubspot_owner_id` (text, nullable) - HubSpot owner ID for this company
    - `domain` (text, nullable) - Company domain from HubSpot
    - `industry` (text, nullable) - Company industry from HubSpot
    - `city` (text, nullable) - Company city from HubSpot

  2. Prospect Table Updates
    - `hubspot_deal_id` (text, nullable) - HubSpot deal ID for synced deals
    - `is_hubspot` (boolean, default false) - Flag indicating if prospect was synced from HubSpot
    - `hubspot_created_at` (timestamptz, nullable) - Creation date from HubSpot
    - `hubspot_updated_at` (timestamptz, nullable) - Last modified date from HubSpot
    - `hubspot_owner_id` (text, nullable) - HubSpot owner ID for this deal
    - `amount` (numeric, nullable) - Deal amount from HubSpot
    - `close_date` (timestamptz, nullable) - Expected close date from HubSpot
    - `deal_stage` (text, nullable) - Deal stage from HubSpot

  3. Indexes and Constraints
    - Indexes for performance on HubSpot ID lookups
    - Unique constraints to prevent duplicate HubSpot records per organization
*/

-- Add HubSpot integration columns to company table
DO $$
BEGIN
  -- Add hubspot_company_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_company_id'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_company_id text;
    COMMENT ON COLUMN company.hubspot_company_id IS 'HubSpot company ID for synced companies';
  END IF;

  -- Add is_hubspot column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'is_hubspot'
  ) THEN
    ALTER TABLE company ADD COLUMN is_hubspot boolean DEFAULT false;
    COMMENT ON COLUMN company.is_hubspot IS 'Flag indicating if this company was synced from HubSpot';
  END IF;

  -- Add hubspot_created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_created_at'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_created_at timestamptz;
    COMMENT ON COLUMN company.hubspot_created_at IS 'Creation date from HubSpot';
  END IF;

  -- Add hubspot_updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_updated_at'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_updated_at timestamptz;
    COMMENT ON COLUMN company.hubspot_updated_at IS 'Last modified date from HubSpot';
  END IF;

  -- Add hubspot_owner_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'hubspot_owner_id'
  ) THEN
    ALTER TABLE company ADD COLUMN hubspot_owner_id text;
    COMMENT ON COLUMN company.hubspot_owner_id IS 'HubSpot owner ID for this company';
  END IF;

  -- Add domain column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'domain'
  ) THEN
    ALTER TABLE company ADD COLUMN domain text;
  END IF;

  -- Add industry column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'industry'
  ) THEN
    ALTER TABLE company ADD COLUMN industry text;
  END IF;

  -- Add city column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'city'
  ) THEN
    ALTER TABLE company ADD COLUMN city text;
  END IF;
END $$;

-- Add HubSpot integration columns to prospect table
DO $$
BEGIN
  -- Add hubspot_deal_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_deal_id'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_deal_id text;
    COMMENT ON COLUMN prospect.hubspot_deal_id IS 'HubSpot deal ID for synced deals';
  END IF;

  -- Add is_hubspot column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'is_hubspot'
  ) THEN
    ALTER TABLE prospect ADD COLUMN is_hubspot boolean DEFAULT false;
    COMMENT ON COLUMN prospect.is_hubspot IS 'Flag indicating if this prospect was synced from HubSpot';
  END IF;

  -- Add hubspot_created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_created_at'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_created_at timestamptz;
    COMMENT ON COLUMN prospect.hubspot_created_at IS 'Creation date from HubSpot';
  END IF;

  -- Add hubspot_updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_updated_at'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_updated_at timestamptz;
    COMMENT ON COLUMN prospect.hubspot_updated_at IS 'Last modified date from HubSpot';
  END IF;

  -- Add hubspot_owner_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'hubspot_owner_id'
  ) THEN
    ALTER TABLE prospect ADD COLUMN hubspot_owner_id text;
    COMMENT ON COLUMN prospect.hubspot_owner_id IS 'HubSpot owner ID for this deal';
  END IF;

  -- Add amount column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'amount'
  ) THEN
    ALTER TABLE prospect ADD COLUMN amount numeric;
    COMMENT ON COLUMN prospect.amount IS 'Deal amount from HubSpot';
  END IF;

  -- Add close_date column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'close_date'
  ) THEN
    ALTER TABLE prospect ADD COLUMN close_date timestamptz;
    COMMENT ON COLUMN prospect.close_date IS 'Expected close date from HubSpot';
  END IF;

  -- Add deal_stage column (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospect' AND column_name = 'deal_stage'
  ) THEN
    ALTER TABLE prospect ADD COLUMN deal_stage text;
    COMMENT ON COLUMN prospect.deal_stage IS 'Deal stage from HubSpot';
  END IF;
END $$;

-- Create indexes for performance
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

-- Create unique constraints to prevent duplicate HubSpot records per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_unique_hubspot_per_org 
ON company(organization_id, hubspot_company_id) 
WHERE hubspot_company_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_unique_hubspot_per_company 
ON prospect(company_id, hubspot_deal_id) 
WHERE hubspot_deal_id IS NOT NULL;