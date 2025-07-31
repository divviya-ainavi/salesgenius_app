/*
  # Add RLS policies for user_feedback_testing table using Supabase Auth ID

  1. Security
    - Enable RLS on user_feedback_testing table
    - Add policies based on Supabase authenticated user ID (auth.uid())
    - Super admin can see all feedback
    - Regular users can only see/modify their own feedback

  2. Policies
    - INSERT: Users can insert their own feedback when authenticated
    - SELECT: Role-based access (super_admin sees all, users see own)
    - UPDATE: Role-based access (super_admin updates all, users update own)
    - DELETE: Role-based access (super_admin deletes all, users delete own)

  3. Changes
    - Enable RLS on user_feedback_testing table
    - Add auth_user_id index for performance
    - Create role-based policies using auth.uid()
*/

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Add index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_auth_user_id 
ON user_feedback_testing(auth_user_id);

-- Policy 1: INSERT - Users can insert their own feedback when authenticated
CREATE POLICY "Users can insert own feedback when authenticated"
ON user_feedback_testing
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth_user_id = auth.uid()
);

-- Policy 2: SELECT - Role-based feedback read access
CREATE POLICY "Role-based feedback read access"
ON user_feedback_testing
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Users can read their own feedback
    auth_user_id = auth.uid()
    OR
    -- Super admin can read all feedback
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
    OR
    -- Org admin can read feedback from their organization
    EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN titles t1 ON p1.title_id = t1.id
      JOIN roles r1 ON t1.role_id = r1.id
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.auth_user_id = auth.uid()
      AND p2.auth_user_id = user_feedback_testing.auth_user_id
      AND r1.key = 'org_admin'
    )
  )
);

-- Policy 3: UPDATE - Role-based feedback update access
CREATE POLICY "Role-based feedback update access"
ON user_feedback_testing
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Users can update their own feedback
    auth_user_id = auth.uid()
    OR
    -- Super admin can update all feedback
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
    OR
    -- Org admin can update feedback from their organization
    EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN titles t1 ON p1.title_id = t1.id
      JOIN roles r1 ON t1.role_id = r1.id
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.auth_user_id = auth.uid()
      AND p2.auth_user_id = user_feedback_testing.auth_user_id
      AND r1.key = 'org_admin'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Users can update their own feedback
    auth_user_id = auth.uid()
    OR
    -- Super admin can update all feedback
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
    OR
    -- Org admin can update feedback from their organization
    EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN titles t1 ON p1.title_id = t1.id
      JOIN roles r1 ON t1.role_id = r1.id
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.auth_user_id = auth.uid()
      AND p2.auth_user_id = user_feedback_testing.auth_user_id
      AND r1.key = 'org_admin'
    )
  )
);

-- Policy 4: DELETE - Role-based feedback delete access
CREATE POLICY "Role-based feedback delete access"
ON user_feedback_testing
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Users can delete their own feedback
    auth_user_id = auth.uid()
    OR
    -- Super admin can delete all feedback
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
    OR
    -- Org admin can delete feedback from their organization
    EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN titles t1 ON p1.title_id = t1.id
      JOIN roles r1 ON t1.role_id = r1.id
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.auth_user_id = auth.uid()
      AND p2.auth_user_id = user_feedback_testing.auth_user_id
      AND r1.key = 'org_admin'
    )
  )
);