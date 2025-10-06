/*
  # Add features array to plan_master table

  1. Schema Changes
    - Add `features` column as text array to plan_master table
    - Update existing Free Plan and Pro Plan with comprehensive features

  2. Features Added
    - Free Plan: Basic features with limitations
    - Pro Plan: Advanced features with unlimited access

  3. Data Population
    - Populates features for both existing plans
    - Uses array format for easy frontend consumption
*/

-- Add features column to plan_master table
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

-- Create Free Plan if it doesn't exist
INSERT INTO plan_master (plan_name, description, price, currency, duration_days, features)
SELECT 
  'Free Plan',
  'Perfect for getting started with AI-powered sales assistance',
  0.00,
  'usd',
  30,
  ARRAY[
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
WHERE NOT EXISTS (
  SELECT 1 FROM plan_master 
  WHERE plan_name ILIKE '%free%' OR plan_name ILIKE '%trial%' OR plan_name ILIKE '%beta%'
);

-- Create Pro Plan if it doesn't exist
INSERT INTO plan_master (plan_name, description, price, currency, duration_days, features)
SELECT 
  'Pro Plan',
  'Advanced AI-powered sales tools for professional sales teams',
  49.00,
  'usd',
  30,
  ARRAY[
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
WHERE NOT EXISTS (
  SELECT 1 FROM plan_master 
  WHERE plan_name ILIKE '%pro%' OR plan_name ILIKE '%standard%' OR plan_name ILIKE '%premium%'
);