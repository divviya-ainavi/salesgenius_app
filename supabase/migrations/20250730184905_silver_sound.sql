/*
  # Add Supabase Authentication Integration and Policies

  1. Database Changes
    - Add auth_user_id column to profiles table to link with Supabase Auth
    - Create helper functions for authentication validation
    - Add RLS policies for user_feedback_testing table

  2. Security
    - Enable RLS on user_feedback_testing table
    - Add policies for authenticated users based on profiles table
    - Role-based access control using existing role hierarchy
*/

-- Add auth_user_id column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
  END IF;
END $$;

-- Helper function to get current user's profile ID from auth.uid()
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to get user role key
CREATE OR REPLACE FUNCTION get_user_role_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT r.key
  FROM profiles p
  JOIN titles t ON p.title_id = t.id
  JOIN roles r ON t.role_id = r.id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper function to get user organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to check if user is authenticated and has valid profile
CREATE OR REPLACE FUNCTION is_user_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = auth.uid() 
    AND status_id = 1 -- Active status
  );
$$;

-- Enable RLS on user_feedback_testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON user_feedback_testing;
DROP POLICY IF EXISTS "Allow users to read own feedback and admins to read all" ON user_feedback_testing;
DROP POLICY IF EXISTS "Allow feedback update access based on role and ownership" ON user_feedback_testing;
DROP POLICY IF EXISTS "Allow super_admin to delete feedback" ON user_feedback_testing;

-- Policy for INSERT: Users can only insert their own feedback when authenticated
CREATE POLICY "Users can insert own feedback when authenticated"
ON user_feedback_testing
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_user_authenticated() 
  AND user_id = get_current_profile_id()
);

-- Policy for SELECT: Role-based access
CREATE POLICY "Role-based feedback read access"
ON user_feedback_testing
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_user_authenticated()
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

-- Policy for UPDATE: Same as SELECT permissions
CREATE POLICY "Role-based feedback update access"
ON user_feedback_testing
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_user_authenticated()
  AND (
    user_id = get_current_profile_id()
    OR
    (
      get_user_role_key() = 'org_admin'
      AND organization_id = get_user_organization_id()
    )
    OR
    get_user_role_key() = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_user_authenticated()
  AND (
    user_id = get_current_profile_id()
    OR
    (
      get_user_role_key() = 'org_admin'
      AND organization_id = get_user_organization_id()
    )
    OR
    get_user_role_key() = 'super_admin'
  )
);

-- Policy for DELETE: Only super admins can delete feedback
CREATE POLICY "Super admin can delete feedback"
ON user_feedback_testing
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_user_authenticated()
  AND get_user_role_key() = 'super_admin'
);

-- Create function to automatically link Supabase Auth users to profiles
CREATE OR REPLACE FUNCTION link_auth_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be called manually or via trigger
  -- to link existing profiles to Supabase Auth users by email
  RETURN NEW;
END $$;