/*
  # Add Public Read Policy to organization_plan Table

  1. Changes
    - Add a new RLS policy to allow public read access to organization_plan table
    - This allows anyone (authenticated or not) to read organization plan data
  
  2. Security
    - SELECT policy with USING (true) for public access
    - Other operations (INSERT, UPDATE, DELETE) remain restricted to authorized users
  
  3. Important Notes
    - This policy is useful for account setup flow where users need to check
      if their organization has an active plan before authentication
    - Existing restrictive policies for write operations remain in place
*/

-- Add public read policy to organization_plan table
CREATE POLICY "Public can read organization plans"
  ON organization_plan
  FOR SELECT
  TO public
  USING (true);
