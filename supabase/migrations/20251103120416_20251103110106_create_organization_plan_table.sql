/*
  # Create organization_plan table

  1. New Tables
    - `organization_plan`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `plan_id` (uuid, foreign key to plan_master)
      - `buy_quantity` (integer) - Number of user seats purchased
      - `used_quantity` (integer) - Number of user seats currently used
      - `stripe_subscription_id` (text)
      - `stripe_customer_id` (text)
      - `stripe_payment_intent_id` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `is_active` (boolean)
      - `canceled_at` (timestamptz)
      - `renewal_date` (timestamptz)
      - `status` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `organization_plan` table
    - Add policies for organization admins to manage their organization plans
    - Add policies for super admins to manage all organization plans

  3. Important Notes
    - buy_quantity: Total number of seats purchased for the organization
    - used_quantity: Current number of active users on the plan
    - Difference (buy_quantity - used_quantity) = available seats
*/

-- Create organization_plan table
CREATE TABLE IF NOT EXISTS public.organization_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plan_master(id) ON DELETE CASCADE,
  buy_quantity integer NOT NULL DEFAULT 2,
  used_quantity integer NOT NULL DEFAULT 0,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  canceled_at timestamptz,
  renewal_date timestamptz,
  status text DEFAULT 'active',
  amount numeric(10, 2),
  currency text DEFAULT 'inr',
  invoice_number text,
  invoice_pdf text,
  hosted_invoice_url text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_quantities CHECK (buy_quantity >= 2 AND used_quantity >= 0 AND used_quantity <= buy_quantity)
);

-- Enable RLS
ALTER TABLE organization_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_plan

-- Organization admins can read their organization's plan
CREATE POLICY "Org admins can read org plan"
  ON organization_plan
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key IN ('org_admin', 'super_admin')
      AND p.organization_id = organization_plan.organization_id
    )
  );

-- Organization admins can insert their organization's plan
CREATE POLICY "Org admins can insert org plan"
  ON organization_plan
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key IN ('org_admin', 'super_admin')
      AND p.organization_id = organization_plan.organization_id
    )
  );

-- Organization admins can update their organization's plan
CREATE POLICY "Org admins can update org plan"
  ON organization_plan
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key IN ('org_admin', 'super_admin')
      AND p.organization_id = organization_plan.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key IN ('org_admin', 'super_admin')
      AND p.organization_id = organization_plan.organization_id
    )
  );

-- Super admins can manage all organization plans
CREATE POLICY "Super admins can manage all org plans"
  ON organization_plan
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
CREATE INDEX IF NOT EXISTS idx_organization_plan_org_id ON organization_plan(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_plan_plan_id ON organization_plan(plan_id);
CREATE INDEX IF NOT EXISTS idx_organization_plan_status ON organization_plan(status);
CREATE INDEX IF NOT EXISTS idx_organization_plan_stripe_subscription_id ON organization_plan(stripe_subscription_id);

-- Add updated_at trigger
CREATE TRIGGER update_organization_plan_updated_at
  BEFORE UPDATE ON organization_plan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();