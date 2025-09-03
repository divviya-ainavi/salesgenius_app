/*
  # Create personal_insights table

  1. New Tables
    - `personal_insights`
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
      - `summary_note` (text)
      - `sources` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `personal_insights` table
    - Add policies for users to manage their own insights
    - Add policies for org admins to access org users' insights
    - Add policies for super admins to access all insights

  3. Storage
    - Create personal-insights storage bucket for file uploads
*/

-- Create personal_insights table
CREATE TABLE IF NOT EXISTS personal_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  summary_note text,
  sources text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE personal_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own personal insights"
  ON personal_insights
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Org admins can access org users' personal insights"
  ON personal_insights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles target_user
        WHERE target_user.id = personal_insights.user_id
        AND target_user.organization_id = p.organization_id
      )
    )
  );

CREATE POLICY "Super admins can access all personal insights"
  ON personal_insights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

-- Create storage bucket for personal insights
INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-insights', 'personal-insights', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own personal insights files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'personal-insights' AND
    (storage.foldername(name))[1] = (SELECT id::text FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can view their own personal insights files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'personal-insights' AND
    (storage.foldername(name))[1] = (SELECT id::text FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own personal insights files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'personal-insights' AND
    (storage.foldername(name))[1] = (SELECT id::text FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_insights_user_id ON personal_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_insights_organization_id ON personal_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_personal_insights_created_at ON personal_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_insights_is_active ON personal_insights(is_active);