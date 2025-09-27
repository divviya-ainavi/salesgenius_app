/*
  # Add plan features to billing system

  1. New Tables
    - `plan_features`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key to plan_master)
      - `feature_name` (text)
      - `feature_description` (text)
      - `is_included` (boolean)
      - `feature_limit` (text, optional)
      - `display_order` (integer)

  2. Security
    - Enable RLS on `plan_features` table
    - Add policy for public read access to plan features

  3. Seed Data
    - Add features for Free Plan and Pro Plan
*/

-- Create plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plan_master(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_description text,
  is_included boolean DEFAULT true,
  feature_limit text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to plan features
CREATE POLICY "Anyone can read plan features"
  ON plan_features
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX idx_plan_features_display_order ON plan_features(plan_id, display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_plan_features_updated_at
  BEFORE UPDATE ON plan_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert features for Free Plan
INSERT INTO plan_features (plan_id, feature_name, feature_description, is_included, feature_limit, display_order)
SELECT 
  pm.id,
  feature_name,
  feature_description,
  is_included,
  feature_limit,
  display_order
FROM plan_master pm,
(VALUES
  ('All AI insights and analysis', 'Complete access to AI-powered call analysis and insights', true, '30 days only', 1),
  ('Unlimited call transcript processing', 'Process unlimited sales call transcripts', true, '30 days only', 2),
  ('Email & presentation generation', 'AI-generated follow-up emails and presentation prompts', true, '30 days only', 3),
  ('HubSpot integration', 'Seamless integration with your HubSpot CRM', true, '30 days only', 4),
  ('Research capabilities', 'Company and prospect research tools', true, '30 days only', 5),
  ('View processed data', 'Access to previously processed data after trial', true, 'After trial expires', 6),
  ('Process new transcripts', 'Ability to process new call transcripts', false, 'Disabled after trial', 7),
  ('Generate new content', 'Create new emails and presentations', false, 'Disabled after trial', 8)
) AS features(feature_name, feature_description, is_included, feature_limit, display_order)
WHERE pm.plan_name = 'Free Plan';

-- Insert features for Pro Plan
INSERT INTO plan_features (plan_id, feature_name, feature_description, is_included, feature_limit, display_order)
SELECT 
  pm.id,
  feature_name,
  feature_description,
  is_included,
  feature_limit,
  display_order
FROM plan_master pm,
(VALUES
  ('Unlimited AI insights and analysis', 'Complete access to AI-powered call analysis and insights', true, null, 1),
  ('Unlimited call transcript processing', 'Process unlimited sales call transcripts', true, null, 2),
  ('Unlimited email & presentation generation', 'AI-generated follow-up emails and presentation prompts', true, null, 3),
  ('Advanced HubSpot integration', 'Full HubSpot CRM integration with advanced features', true, null, 4),
  ('Unlimited research capabilities', 'Comprehensive company and prospect research tools', true, null, 5),
  ('Priority support', '24/7 priority customer support', true, null, 6),
  ('Advanced analytics', 'Detailed performance metrics and insights', true, null, 7),
  ('Team collaboration features', 'Share insights and collaborate with team members', true, null, 8)
) AS features(feature_name, feature_description, is_included, feature_limit, display_order)
WHERE pm.plan_name = 'Pro Plan';