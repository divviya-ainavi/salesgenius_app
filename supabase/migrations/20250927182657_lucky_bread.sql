/*
  # Create billing and subscription tables

  1. New Tables
    - `plan_master`
      - `id` (uuid, primary key)
      - `plan_name` (text, unique)
      - `description` (text)
      - `price` (numeric)
      - `currency` (text, default 'usd')
      - `duration_days` (integer)
      - `stripe_product_id` (text)
      - `stripe_price_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_plan`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `plan_id` (uuid, foreign key to plan_master)
      - `stripe_subscription_id` (text)
      - `stripe_payment_intent_id` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `is_active` (boolean)
      - `canceled_at` (timestamptz)
      - `renewal_date` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access to their own plans
    - Add policies for admin access

  3. Seed Data
    - Insert Free Plan and Pro Plan with Stripe details
*/

-- Create plan_master table
CREATE TABLE IF NOT EXISTS public.plan_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  description text,
  price numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  duration_days integer NOT NULL,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_plan table
CREATE TABLE IF NOT EXISTS public.user_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plan_master(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  canceled_at timestamptz,
  renewal_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE plan_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_master
CREATE POLICY "Anyone can read plan_master"
  ON plan_master
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Super admin can manage plan_master"
  ON plan_master
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

-- RLS Policies for user_plan
CREATE POLICY "Users can read own user_plan"
  ON user_plan
  FOR SELECT
  TO public
  USING (
    user_id = (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own user_plan"
  ON user_plan
  FOR INSERT
  TO public
  WITH CHECK (
    user_id = (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own user_plan"
  ON user_plan
  FOR UPDATE
  TO public
  USING (
    user_id = (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Org admin can access org users' plans"
  ON user_plan
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = user_plan.user_id
        AND p2.organization_id = p1.organization_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid()
      AND r.key = 'org_admin'
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = user_plan.user_id
        AND p2.organization_id = p1.organization_id
      )
    )
  );

CREATE POLICY "Super admin can manage all user_plans"
  ON user_plan
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_plan_user_id ON user_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plan_plan_id ON user_plan(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plan_status ON user_plan(status);
CREATE INDEX IF NOT EXISTS idx_user_plan_end_date ON user_plan(end_date);
CREATE INDEX IF NOT EXISTS idx_user_plan_stripe_subscription_id ON user_plan(stripe_subscription_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_plan_master_updated_at
  BEFORE UPDATE ON plan_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plan_updated_at
  BEFORE UPDATE ON user_plan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for plans
INSERT INTO plan_master (plan_name, description, price, currency, duration_days, stripe_product_id, stripe_price_id) VALUES
  (
    'Free Plan',
    'Full access for 30 days, then view-only access to processed data',
    0.00,
    'usd',
    30,
    NULL,
    NULL
  ),
  (
    'Pro',
    'Unlimited access to all features including processing, research, email generation, and presentations',
    49.00,
    'usd',
    30,
    'prod_T7puPcK40F2TcQ',
    'price_1SBaEvDNBi73M7eX1dOkDTAL'
  )
ON CONFLICT (plan_name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = now();