/*
  # Fix ResearchCompany INSERT Policy

  1. Security Updates
    - Drop existing policy that may not be working correctly for INSERT operations
    - Create separate policies for different operations to ensure INSERT works properly
    - Allow authenticated users to insert their own research data
    - Allow authenticated users to select, update, and delete their own research data

  2. Changes
    - Drop the existing "Users can manage their own research data" policy
    - Create specific policies for INSERT, SELECT, UPDATE, and DELETE operations
    - Ensure all policies use proper auth.uid() checks
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own research data" ON "ResearchCompany";

-- Create separate policies for each operation to ensure they work correctly

-- Allow authenticated users to insert their own research data
CREATE POLICY "Allow authenticated users to insert research"
  ON "ResearchCompany"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to select their own research data
CREATE POLICY "Allow authenticated users to select own research"
  ON "ResearchCompany"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own research data
CREATE POLICY "Allow authenticated users to update own research"
  ON "ResearchCompany"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own research data
CREATE POLICY "Allow authenticated users to delete own research"
  ON "ResearchCompany"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);