/*
  # Add role-based policies for user_feedback_testing table

  1. Database Changes
    - Enable RLS on user_feedback_testing table
    - Add policies for role-based access control
    - Super admin can see all feedbacks
    - Users can only see their own feedbacks
    - Link feedback with auth_user_id

  2. Security
    - Enable RLS on user_feedback_testing table
    - Add INSERT policy for authenticated users
    - Add SELECT policy with role-based access
    - Add UPDATE policy with role-based access  
    - Add DELETE policy for super admin only

  3. Helper Functions
    - Use existing helper functions for role checking
    - Integrate with Supabase Auth system
*/

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback read access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback update access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Super admin can delete feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can insert own feedback when authenticated" ON user_feedback_testing;

-- INSERT Policy: Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = get_current_profile_id()
    AND auth_user_id = auth.uid()
  );

-- SELECT Policy: Role-based read access
CREATE POLICY "Role-based feedback read access"
  ON user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- Users can read their own feedback
      user_id = get_current_profile_id()
      OR
      -- Org admins can read feedback from their organization
      (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR
      -- Super admins can read all feedback
      get_user_role_key() = 'super_admin'
    )
  );

-- UPDATE Policy: Role-based update access
CREATE POLICY "Role-based feedback update access"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- Users can update their own feedback
      user_id = get_current_profile_id()
      OR
      -- Org admins can update feedback from their organization
      (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR
      -- Super admins can update all feedback
      get_user_role_key() = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
      -- Users can update their own feedback
      user_id = get_current_profile_id()
      OR
      -- Org admins can update feedback from their organization
      (
        get_user_role_key() = 'org_admin' 
        AND organization_id = get_user_organization_id()
      )
      OR
      -- Super admins can update all feedback
      get_user_role_key() = 'super_admin'
    )
  );

-- DELETE Policy: Only super admin can delete feedback
CREATE POLICY "Super admin can delete feedback"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role_key() = 'super_admin'
  );