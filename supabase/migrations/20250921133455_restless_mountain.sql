/*
  # Create plan table for user subscription management

  1. New Tables
    - `plan`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `plan_name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `no_of_days` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `plan` table
    - Add policies for users to manage their own plans
    - Add policies for org admins and super admins
*/

CREATE TABLE IF NOT EXISTS plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  no_of_days integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plan ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint
ALTER TABLE plan 
ADD CONSTRAINT plan_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_plan_user_id ON plan(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_end_date ON plan(end_date);

-- RLS Policies
CREATE POLICY "Users can read own plan"
  ON plan
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own plan"
  ON plan
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own plan"
  ON plan
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Org admin can access org users' plans"
  ON plan
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid() 
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 
        FROM profiles p2 
        WHERE p2.id = plan.user_id 
        AND p2.organization_id = p1.organization_id
      )
    )
  );

CREATE POLICY "Super admin can access all plans"
  ON plan
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid() 
      AND r.key = 'super_admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_updated_at
  BEFORE UPDATE ON plan
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_updated_at();