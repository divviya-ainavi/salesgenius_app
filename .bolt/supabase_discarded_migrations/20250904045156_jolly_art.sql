/*
  # Create business_knowledge_personal table

  1. New Tables
    - `business_knowledge_personal`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `organization_id` (uuid, foreign key to organizations)
      - `rep_name` (text)
      - `role_title` (text)
      - `territory` (text)
      - `vertical_focus` (text array)
      - `quota` (text)
      - `time_horizon` (text)
      - `active_pipeline` (text array)
      - `personal_proof_bank` (text array)
      - `relationship_capital` (text array)
      - `selling_style_strengths` (text array)
      - `common_objections_encountered` (text array)
      - `preferred_advance_per_account` (text)
      - `availability_windows` (text array)
      - `product_certifications` (text array)
      - `brand_voice_tone` (text)
      - `sources` (text array)
      - `summary_note` (text)
      - `processed_file_ids` (uuid array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `business_knowledge_personal` table
    - Add policies for user, org admin, and super admin access

  3. Indexes
    - Add indexes for user_id and organization_id for performance
*/

CREATE TABLE IF NOT EXISTS business_knowledge_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  rep_name text,
  role_title text,
  territory text,
  vertical_focus text[],
  quota text,
  time_horizon text,
  active_pipeline text[],
  personal_proof_bank text[],
  relationship_capital text[],
  selling_style_strengths text[],
  common_objections_encountered text[],
  preferred_advance_per_account text,
  availability_windows text[],
  product_certifications text[],
  brand_voice_tone text,
  sources text[],
  summary_note text,
  processed_file_ids uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE business_knowledge_personal ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
ALTER TABLE business_knowledge_personal 
ADD CONSTRAINT fk_business_knowledge_personal_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE business_knowledge_personal 
ADD CONSTRAINT fk_business_knowledge_personal_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_knowledge_personal_user_id 
ON business_knowledge_personal(user_id);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_personal_organization_id 
ON business_knowledge_personal(organization_id);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_personal_created_at 
ON business_knowledge_personal(created_at DESC);

-- RLS Policies

-- Users can access their own personal insights
CREATE POLICY "Users can access own personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = uid()));

-- Org admins can access personal insights of users in their organization
CREATE POLICY "Org admin access to org users' personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = uid() 
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles target_user
        WHERE target_user.id = business_knowledge_personal.user_id
        AND target_user.organization_id = p.organization_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = uid() 
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles target_user
        WHERE target_user.id = business_knowledge_personal.user_id
        AND target_user.organization_id = p.organization_id
      )
    )
  );

-- Super admins have full access
CREATE POLICY "Super admin full access to personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = uid() 
      AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = uid() 
      AND r.key = 'super_admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_knowledge_personal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_knowledge_personal_updated_at
  BEFORE UPDATE ON business_knowledge_personal
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_personal_updated_at();