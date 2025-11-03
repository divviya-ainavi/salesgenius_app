/*
  # Sample Organization Plan Setup (For Testing)

  This migration creates a sample organization plan for testing purposes.
  You can customize the values or remove this file if not needed.

  1. Updates
    - Sets up a sample "Business" plan as an organization plan
    - Configures pricing and minimum users

  2. Important Notes
    - This is for testing/development purposes
    - Update the plan_name to match your existing plan or create a new one
    - Remove or modify this file based on your needs
*/

-- Example: Update an existing "Business" plan to be an organization plan
-- Replace 'Business' with your actual organization plan name
UPDATE plan_master
SET
  is_organization_plan = true,
  price_per_user = 2599,  -- Price per user per month (in INR)
  minimum_users = 2,
  features = ARRAY[
    'Unlimited transcription minutes',
    'Advanced AI insights',
    'Team collaboration',
    'Priority support',
    'Custom integrations'
  ]
WHERE plan_name ILIKE '%business%'
  OR plan_name ILIKE '%team%'
  OR plan_name ILIKE '%organization%';

-- OR: Create a new organization plan
-- Uncomment and modify as needed:
/*
INSERT INTO plan_master (
  plan_name,
  description,
  price,
  price_per_user,
  currency,
  duration_days,
  is_organization_plan,
  minimum_users,
  features,
  stripe_product_id,
  stripe_price_id
) VALUES (
  'ChatGPT Business',
  'Perfect for growing teams and organizations',
  2599,  -- Base price (not used for org plans, but required)
  2599,  -- Price per user
  'inr',
  30,  -- Monthly
  true,
  2,
  ARRAY[
    'Unlimited AI-powered meeting transcriptions',
    'Advanced analytics and insights',
    'Team collaboration tools',
    'Priority support',
    'Custom integrations',
    'Admin dashboard'
  ],
  'prod_xxxxx',  -- Replace with actual Stripe product ID
  'price_xxxxx'  -- Replace with actual Stripe price ID
);
*/
