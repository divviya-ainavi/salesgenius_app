/*
  # Create business knowledge data table

  1. New Tables
    - `business_knowledge_data`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `user_id` (uuid, foreign key to profiles)
      - `organization_name` (text)
      - `static_supply_elements` (jsonb)
      - `dynamic_supply_elements` (jsonb)
      - `offer_definition` (jsonb)
      - `pricing_and_objections` (jsonb)
      - `icp` (jsonb)
      - `reframe_narratives` (jsonb)
      - `sales_methodology` (jsonb)
      - `brand_voice_guidelines` (text)
      - `assets_detected` (text[])
      - `sources` (text[])
      - `summary_note` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `business_knowledge_data` table
    - Add policies for user access control

  3. Changes
    - Add `business_knowledge_data_id` column to `business_knowledge_files` table
    - Add foreign key constraint
*/

CREATE TABLE IF NOT EXISTS business_knowledge_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name text,
  static_supply_elements jsonb,
  dynamic_supply_elements jsonb,
  offer_definition jsonb,
  pricing_and_objections jsonb,
  icp jsonb,
  reframe_narratives jsonb,
  sales_methodology jsonb,
  brand_voice_guidelines text,
  assets_detected text[],
  sources text[],
  summary_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE business_knowledge_data ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can access their own business knowledge data"
  ON business_knowledge_data
  FOR ALL
  TO public
  USING (user_id = (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = uid()));

CREATE POLICY "Org admin can access org business knowledge data"
  ON business_knowledge_data
  FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM ((profiles p
      JOIN titles t ON ((p.title_id = t.id)))
      JOIN roles r ON ((t.role_id = r.id)))
    WHERE ((p.auth_user_id = uid()) AND (r.key = 'org_admin'::text) AND (EXISTS (
      SELECT 1 FROM profiles data_owner
      WHERE ((data_owner.id = business_knowledge_data.user_id) AND (data_owner.organization_id = p.organization_id))
    )))
  ));

CREATE POLICY "Super admin has full access to business knowledge data"
  ON business_knowledge_data
  FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM ((profiles p
      JOIN titles t ON ((p.title_id = t.id)))
      JOIN roles r ON ((t.role_id = r.id)))
    WHERE ((p.auth_user_id = uid()) AND (r.key = 'super_admin'::text))
  ));

-- Add business_knowledge_data_id column to business_knowledge_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_knowledge_files' AND column_name = 'business_knowledge_data_id'
  ) THEN
    ALTER TABLE business_knowledge_files ADD COLUMN business_knowledge_data_id uuid REFERENCES business_knowledge_data(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_business_knowledge_data_org_id ON business_knowledge_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_data_user_id ON business_knowledge_data(user_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_files_data_id ON business_knowledge_files(business_knowledge_data_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_knowledge_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_knowledge_data_updated_at
  BEFORE UPDATE ON business_knowledge_data
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_data_updated_at();