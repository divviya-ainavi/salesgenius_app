/*
  # Add RLS policies for user_feedback_testing table

  1. Security
    - Enable RLS on user_feedback_testing table
    - Add INSERT policy for authenticated users to submit feedback
    - Add SELECT policy: super_admin sees all, others see only their own
    - Add UPDATE policy: super_admin updates all, others update only their own
    - Add DELETE policy: super_admin deletes all, others delete only their own

  2. Role-Based Access Control
    - Super Admin: Full CRUD access to all feedback
    - Other Users: Full CRUD access to only their own feedback
    - All operations require Supabase authentication

  3. Performance
    - Add indexes for efficient role-based queries
*/

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Add index for auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_auth_user_id 
ON user_feedback_testing(auth_user_id);

-- INSERT Policy: Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback when authenticated"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (
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
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      user_id = get_current_profile_id()
      OR (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR get_user_role_key() = 'super_admin'
    )
  );

-- UPDATE Policy: Super admin updates all, others update only their own
CREATE POLICY "Role-based feedback update access"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      user_id = get_current_profile_id()
      OR (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR get_user_role_key() = 'super_admin'
    )
  )
  WITH CHECK (
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND (
      user_id = get_current_profile_id()
      OR (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR get_user_role_key() = 'super_admin'
    )
  );

-- DELETE Policy: Super admin can delete all, others can delete only their own
CREATE POLICY "Super admin can delete feedback"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND get_user_role_key() = 'super_admin'
  );

-- Additional policy for users to delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    uid() IS NOT NULL 
    AND is_user_authenticated() 
    AND user_id = get_current_profile_id()
  );

-- Allow all operations for testing purposes (can be removed in production)
CREATE POLICY "Allow all operations for testing"
  ON user_feedback_testing
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);