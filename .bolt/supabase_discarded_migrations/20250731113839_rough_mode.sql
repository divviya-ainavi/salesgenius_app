/*
  # Fix RLS policies for user_feedback_testing table

  1. Security Changes
    - Drop all existing policies on user_feedback_testing table
    - Enable RLS on user_feedback_testing table
    - Add role-based policies using Supabase auth ID
    - Add indexes for performance

  2. Policy Structure
    - INSERT: Authenticated users can insert their own feedback
    - SELECT: Role-based access (super_admin sees all, org_admin sees org, users see own)
    - UPDATE: Role-based access (same as SELECT)
    - DELETE: Role-based access (same as SELECT)

  3. Helper Functions
    - Uses existing get_user_role_key() and get_user_organization_id() functions
    - Validates Supabase authentication with auth.uid()
*/

-- Drop all existing policies on user_feedback_testing table
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback read access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Role-based feedback update access" ON user_feedback_testing;
DROP POLICY IF EXISTS "Super admin can delete feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Users can insert own feedback when authenticated" ON user_feedback_testing;

-- Ensure RLS is enabled
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Add index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_auth_user_id 
ON user_feedback_testing(auth_user_id);

-- Policy 1: INSERT - Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth_user_id = auth.uid()
  );

-- Policy 2: SELECT - Role-based read access
CREATE POLICY "Role-based feedback read access"
  ON user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Super admin can see all feedback
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'super_admin'
        )
      )
      OR
      -- Org admin can see feedback from their organization
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'org_admin'
          AND organization_id = p.organization_id
        )
      )
      OR
      -- Users can see their own feedback
      (auth_user_id = auth.uid())
    )
  );

-- Policy 3: UPDATE - Role-based update access
CREATE POLICY "Role-based feedback update access"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Super admin can update all feedback
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'super_admin'
        )
      )
      OR
      -- Org admin can update feedback from their organization
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'org_admin'
          AND organization_id = p.organization_id
        )
      )
      OR
      -- Users can update their own feedback
      (auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Super admin can update all feedback
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'super_admin'
        )
      )
      OR
      -- Org admin can update feedback from their organization
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'org_admin'
          AND organization_id = p.organization_id
        )
      )
      OR
      -- Users can update their own feedback
      (auth_user_id = auth.uid())
    )
  );

-- Policy 4: DELETE - Role-based delete access
CREATE POLICY "Role-based feedback delete access"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Super admin can delete all feedback
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'super_admin'
        )
      )
      OR
      -- Org admin can delete feedback from their organization
      (
        EXISTS (
          SELECT 1 FROM profiles p
          JOIN titles t ON p.title_id = t.id
          JOIN roles r ON t.role_id = r.id
          WHERE p.auth_user_id = auth.uid()
          AND r.key = 'org_admin'
          AND organization_id = p.organization_id
        )
      )
      OR
      -- Users can delete their own feedback
      (auth_user_id = auth.uid())
    )
  );