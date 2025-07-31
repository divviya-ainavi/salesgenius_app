/*
  # Add RBAC policies for user_feedback_testing table

  1. Security
    - Enable RLS on user_feedback_testing table
    - Add role-based access control policies
    - Super admin can see all feedbacks
    - Other users can only manage their own feedback

  2. Policies
    - INSERT: All authenticated users can add feedback
    - SELECT: Super admin sees all, others see only their own
    - UPDATE: Super admin can update all, others only their own
    - DELETE: Super admin can delete all, others only their own

  3. Helper Functions
    - Uses existing helper functions for role checking
    - Integrates with current authentication system
*/

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback read access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback update access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Super admin can delete feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can insert own feedback when authenticated" ON user_feedback_testing;

-- INSERT Policy: All authenticated users can add feedback
CREATE POLICY "Users can insert feedback when authenticated"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated through Supabase
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND user_id = get_current_profile_id()
  );

-- SELECT Policy: Super admin sees all, others see only their own
CREATE POLICY "Role-based feedback read access"
  ON user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (
    -- User must be authenticated
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      -- Super admin can see all feedback
      get_user_role_key() = 'super_admin'
      OR
      -- Users can see their own feedback
      user_id = get_current_profile_id()
    )
  );

-- UPDATE Policy: Super admin can update all, others only their own
CREATE POLICY "Role-based feedback update access"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (
    -- User must be authenticated
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      -- Super admin can update all feedback
      get_user_role_key() = 'super_admin'
      OR
      -- Users can update their own feedback
      user_id = get_current_profile_id()
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      get_user_role_key() = 'super_admin'
      OR
      user_id = get_current_profile_id()
    )
  );

-- DELETE Policy: Super admin can delete all, others only their own
CREATE POLICY "Role-based feedback delete access"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    -- User must be authenticated
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      -- Super admin can delete all feedback
      get_user_role_key() = 'super_admin'
      OR
      -- Users can delete their own feedback
      user_id = get_current_profile_id()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_auth_user_id 
  ON user_feedback_testing(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_user_role 
  ON user_feedback_testing(user_id);

-- Add comment to document the policy structure
COMMENT ON TABLE user_feedback_testing IS 'User feedback table with role-based access control. Super admins can see all feedback, other users can only manage their own feedback.';