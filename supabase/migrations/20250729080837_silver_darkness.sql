/*
  # Fix user_feedback_testing table for proper testing

  1. Temporarily disable RLS for testing
  2. Add simple policies that work with both authenticated and unauthenticated users
  3. Make user_id nullable for testing purposes
*/

-- First, disable RLS temporarily to allow testing
ALTER TABLE user_feedback_testing DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Simple insert for authenticated users" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can read own feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can update own feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can delete own feedback" ON user_feedback_testing;

-- Make user_id nullable for testing
ALTER TABLE user_feedback_testing ALTER COLUMN user_id DROP NOT NULL;

-- Re-enable RLS
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Create very simple policies for testing
CREATE POLICY "Allow all operations for testing"
  ON user_feedback_testing
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Alternative: If you want to test with authentication, use these policies instead:
-- (Comment out the above policy and uncomment these)

/*
CREATE POLICY "Allow insert for any user"
  ON user_feedback_testing
  FOR INSERT
  TO public
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE user_id IS NULL
    END
  );

CREATE POLICY "Allow select for any user"
  ON user_feedback_testing
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow update for owner"
  ON user_feedback_testing
  FOR UPDATE
  TO public
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Allow delete for owner"
  ON user_feedback_testing
  FOR DELETE
  TO public
  USING (user_id = auth.uid() OR user_id IS NULL);
*/