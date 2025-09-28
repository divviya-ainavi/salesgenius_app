/*
  # Add features field to plan_master table

  1. Schema Changes
    - Add `features` column as text array to plan_master table
    - Populate features for existing Free and Pro plans
    
  2. Features Data
    - Free Plan: 9 features with usage limitations
    - Pro Plan: 15 comprehensive unlimited features
    
  3. Safety
    - Check if column exists before adding
    - Update existing plans with feature lists
*/

-- Add features column to plan_master table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_master' AND column_name = 'features'
  ) THEN
    ALTER TABLE plan_master ADD COLUMN features text[];
  END IF;
END $$;

-- Update Free Plan features
UPDATE plan_master 
SET features = ARRAY[
  'Process up to 5 call transcripts per month',
  'Generate up to 10 follow-up emails per month', 
  'Create up to 5 presentation prompts per month',
  'Basic AI insights and analysis',
  'Standard email templates',
  'Basic analytics dashboard',
  'Community support',
  'Data export (CSV format)',
  '30-day trial period'
]
WHERE plan_name ILIKE '%free%' OR plan_name ILIKE '%trial%' OR plan_name ILIKE '%beta%';

-- Update Pro Plan features  
UPDATE plan_master
SET features = ARRAY[
  'Unlimited call transcript processing',
  'Unlimited follow-up email generation',
  'Unlimited presentation prompt creation', 
  'Advanced AI insights and recommendations',
  'HubSpot CRM integration (bidirectional sync)',
  'Custom email templates and branding',
  'Advanced analytics and reporting',
  'Team collaboration and sharing',
  'Priority customer support (24/7)',
  'API access for custom integrations',
  'Advanced security and compliance',
  'Data export (multiple formats)',
  'Custom sales methodology integration',
  'Advanced prospect research tools',
  'Bulk operations and automation'
]
WHERE plan_name ILIKE '%pro%' OR plan_name ILIKE '%standard%' OR plan_name ILIKE '%premium%';

-- Create index on features for better query performance
CREATE INDEX IF NOT EXISTS idx_plan_master_features ON plan_master USING gin(features);