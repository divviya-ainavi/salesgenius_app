/*
  # Add Role-Based RLS Policies for user_feedback_testing

  1. Security
    - Enable RLS on user_feedback_testing table
    - Add policies based on user roles from profiles → titles → roles chain
    - Super admin gets full access to all feedback
    - All other users can only manage their own feedback

  2. Policies
    - INSERT: Authenticated users can insert their own feedback
    - SELECT: Super admin sees all, others see only their own
    - UPDATE: Super admin updates all, others update only their own  
    - DELETE: Super admin deletes all, others delete only their own

  3. Performance
    - Add index on auth_user_id for efficient queries
*/

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback read access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback update access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Super admin can delete feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can insert own feedback when authenticated" ON user_feedback_testing;

-- Add index on auth_user_id for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_auth_user_id 
ON user_feedback_testing(auth_user_id);

-- Helper function to get user role key from auth user
CREATE OR REPLACE FUNCTION get_auth_user_role_key()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT r.key
    FROM profiles p
    JOIN titles t ON p.title_id = t.id
    JOIN roles r ON t.role_id = r.id
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user profile ID from auth user
CREATE OR REPLACE FUNCTION get_auth_user_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT p.id
    FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERT Policy: Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth_user_id = auth.uid()
    AND user_id = get_auth_user_profile_id()
  );

-- SELECT Policy: Super admin sees all, others see only their own
CREATE POLICY "Role-based feedback read access"
  ON user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      get_auth_user_role_key() = 'super_admin'
      OR auth_user_id = auth.uid()
    )
  );

-- UPDATE Policy: Super admin updates all, others update only their own
CREATE POLICY "Role-based feedback update access"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      get_auth_user_role_key() = 'super_admin'
      OR auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      get_auth_user_role_key() = 'super_admin'
      OR auth_user_id = auth.uid()
    )
  );

-- DELETE Policy: Super admin deletes all, others delete only their own
CREATE POLICY "Role-based feedback delete access"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      get_auth_user_role_key() = 'super_admin'
      OR auth_user_id = auth.uid()
    )
  );