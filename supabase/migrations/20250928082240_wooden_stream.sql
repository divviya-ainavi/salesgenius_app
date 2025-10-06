/*
  # Populate user_plan table for existing users

  1. Data Migration
    - Insert user_plan records for all existing users in profiles table
    - Assign Free Plan to all users
    - Set 30-day duration from creation date
    - Mark as active with trial status

  2. Logic
    - Uses profiles.created_at as start_date
    - Calculates end_date as 30 days from start_date
    - Sets status as 'trial' for Free Plan users
    - Handles existing user_plan records gracefully
*/

-- Insert user_plan records for all existing users who don't already have a plan
INSERT INTO public.user_plan (
  user_id,
  plan_id,
  start_date,
  end_date,
  is_active,
  status,
  created_at,
  updated_at
)
SELECT 
  p.id as user_id,
  pm.id as plan_id,
  p.created_at as start_date,
  p.created_at + INTERVAL '30 days' as end_date,
  CASE 
    WHEN p.created_at + INTERVAL '30 days' > NOW() THEN true 
    ELSE false 
  END as is_active,
  CASE 
    WHEN p.created_at + INTERVAL '30 days' > NOW() THEN 'trial'
    ELSE 'expired'
  END as status,
  NOW() as created_at,
  NOW() as updated_at
FROM public.profiles p
CROSS JOIN public.plan_master pm
WHERE pm.plan_name = 'Free Plan'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_plan up 
    WHERE up.user_id = p.id
  );

-- Update renewal_date for all newly created user_plan records
UPDATE public.user_plan 
SET renewal_date = end_date
WHERE renewal_date IS NULL;