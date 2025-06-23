/*
  # Fix ResearchCompany RLS policies

  1. Security Updates
    - Drop existing conflicting RLS policies
    - Create new comprehensive RLS policy for ResearchCompany table
    - Ensure proper authentication checks for INSERT operations

  2. Changes
    - Remove duplicate/conflicting policies
    - Add single comprehensive policy for all operations
    - Ensure auth.uid() is properly used for user identification
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow insert for own research" ON "ResearchCompany";
DROP POLICY IF EXISTS "Allow insert for own research data" ON "ResearchCompany";
DROP POLICY IF EXISTS "Allow logged-in users to access their own research" ON "ResearchCompany";

-- Create a comprehensive policy for all operations
CREATE POLICY "Users can manage their own research data"
  ON "ResearchCompany"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE "ResearchCompany" ENABLE ROW LEVEL SECURITY;