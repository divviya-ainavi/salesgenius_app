/*
  # Add Stripe Payment Fields to User Plan Table

  1. New Columns Added
    - `stripe_customer_id` (text) - Stripe customer identifier
    - `invoice_number` (text) - Human-readable invoice number
    - `invoice_id` (text) - Stripe invoice identifier
    - `charge_id` (text) - Stripe charge identifier
    - `plan_name` (text) - Plan name for easy reference
    - `amount` (numeric) - Payment amount
    - `currency` (text) - Payment currency (default: 'usd')
    - `invoice_pdf` (text) - URL to invoice PDF
    - `hosted_invoice_url` (text) - Stripe hosted invoice URL
    - `receipt_url` (text) - Stripe receipt URL

  2. Indexes
    - Added indexes for frequently queried Stripe fields

  3. Security
    - No RLS changes needed (existing policies cover new fields)
*/

-- Add Stripe payment tracking fields to user_plan table
DO $$
BEGIN
  -- Add stripe_customer_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN stripe_customer_id text;
  END IF;

  -- Add invoice_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN invoice_number text;
  END IF;

  -- Add invoice_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN invoice_id text;
  END IF;

  -- Add charge_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'charge_id'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN charge_id text;
  END IF;

  -- Add plan_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN plan_name text;
  END IF;

  -- Add amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'amount'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN amount numeric(10,2);
  END IF;

  -- Add currency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'currency'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN currency text DEFAULT 'usd';
  END IF;

  -- Add invoice_pdf column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'invoice_pdf'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN invoice_pdf text;
  END IF;

  -- Add hosted_invoice_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'hosted_invoice_url'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN hosted_invoice_url text;
  END IF;

  -- Add receipt_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_plan' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE user_plan ADD COLUMN receipt_url text;
  END IF;
END $$;

-- Create indexes for frequently queried Stripe fields
CREATE INDEX IF NOT EXISTS idx_user_plan_stripe_customer_id 
ON user_plan (stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_plan_invoice_id 
ON user_plan (invoice_id) 
WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_plan_charge_id 
ON user_plan (charge_id) 
WHERE charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_plan_plan_name 
ON user_plan (plan_name) 
WHERE plan_name IS NOT NULL;

-- Add comment to table explaining the new fields
COMMENT ON COLUMN user_plan.stripe_customer_id IS 'Stripe customer identifier for payment tracking';
COMMENT ON COLUMN user_plan.invoice_number IS 'Human-readable invoice number from Stripe';
COMMENT ON COLUMN user_plan.invoice_id IS 'Stripe invoice identifier';
COMMENT ON COLUMN user_plan.charge_id IS 'Stripe charge identifier for this payment';
COMMENT ON COLUMN user_plan.plan_name IS 'Plan name for easy reference without joining plan_master';
COMMENT ON COLUMN user_plan.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN user_plan.currency IS 'Payment currency (default: USD)';
COMMENT ON COLUMN user_plan.invoice_pdf IS 'URL to downloadable invoice PDF';
COMMENT ON COLUMN user_plan.hosted_invoice_url IS 'Stripe hosted invoice URL';
COMMENT ON COLUMN user_plan.receipt_url IS 'Stripe receipt URL for customer access';