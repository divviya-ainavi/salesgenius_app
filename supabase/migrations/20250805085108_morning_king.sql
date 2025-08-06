/*
  # Add onboarding tour tracking to profiles

  1. New Columns
    - `has_seen_onboarding_tour` (boolean, default false) - tracks if user has completed the onboarding tour

  2. Changes
    - Add column to existing profiles table
    - Set default value to false for new users
    - Existing users will have null initially (treated as false)
*/

-- Add the onboarding tour column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_seen_onboarding_tour'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_seen_onboarding_tour boolean DEFAULT false;
  END IF;
END $$;

-- Update existing users to have the tour available (set to false)
UPDATE profiles 
SET has_seen_onboarding_tour = false 
WHERE has_seen_onboarding_tour IS NULL;