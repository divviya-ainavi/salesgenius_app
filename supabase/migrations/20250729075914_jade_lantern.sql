/*
  # Create user_feedback_testing table with RLS policies

  1. New Tables
    - `user_feedback_testing`
      - Same structure as user_feedback table
      - For testing RLS policies without affecting production data

  2. Security
    - Enable RLS on `user_feedback_testing` table
    - Add policies for INSERT, SELECT, UPDATE, DELETE operations
    - Test different permission levels based on user roles

  3. Helper Functions
    - Create helper functions for role and organization checks
    - These functions will be used in RLS policies
*/

-- Create helper functions if they don't exist
CREATE OR REPLACE FUNCTION get_user_role_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_key TEXT;
BEGIN
    SELECT r.key INTO user_role_key
    FROM public.profiles p
    JOIN public.titles t ON p.title_id = t.id
    JOIN public.roles r ON t.role_id = r.id
    WHERE p.id = auth.uid();
    RETURN user_role_key;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_org_id UUID;
BEGIN
    SELECT organization_id INTO user_org_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_org_id;
END;
$$;

-- Create user_feedback_testing table with same structure as user_feedback
CREATE TABLE IF NOT EXISTS user_feedback_testing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    page_url text NOT NULL,
    page_route text NOT NULL,
    what_you_like text,
    what_needs_improving text,
    new_features_needed text,
    session_id text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    organization_id uuid
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_user_id ON user_feedback_testing(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_organization_id ON user_feedback_testing(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_created_at ON user_feedback_testing(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_page_route ON user_feedback_testing(page_route);
CREATE INDEX IF NOT EXISTS idx_user_feedback_testing_is_active ON user_feedback_testing(is_active);

-- Add foreign key constraints
ALTER TABLE user_feedback_testing 
ADD CONSTRAINT user_feedback_testing_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_feedback_testing 
ADD CONSTRAINT user_feedback_testing_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Enable RLS on the testing table
ALTER TABLE user_feedback_testing ENABLE ROW LEVEL SECURITY;

-- Policy 1: INSERT - Allow authenticated users to insert their own feedback
CREATE POLICY "Allow authenticated users to insert feedback"
ON user_feedback_testing FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: SELECT - Users can read own feedback, admins can read based on role
CREATE POLICY "Allow users to read own feedback and admins to read all"
ON user_feedback_testing FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid()) -- User can read their own feedback
    OR 
    (
        EXISTS (
            SELECT 1 
            FROM profiles p
            JOIN titles t ON p.title_id = t.id
            JOIN roles r ON t.role_id = r.id
            WHERE p.id = auth.uid() 
            AND r.key IN ('super_admin', 'org_admin')
        )
    )
);

-- Policy 3: UPDATE - Users can update own feedback, admins can update based on role and organization
CREATE POLICY "Allow feedback update access based on role and ownership"
ON user_feedback_testing FOR UPDATE
TO public
USING (
    (user_id = auth.uid()) -- User can update their own feedback
    OR 
    (
        (get_user_role_key() = 'org_admin' AND organization_id = get_user_organization_id())
    ) -- Org admin can update feedback within their organization
    OR 
    (get_user_role_key() = 'super_admin') -- Super admin can update all feedback
)
WITH CHECK (
    (user_id = auth.uid()) -- User can update their own feedback
    OR 
    (
        (get_user_role_key() = 'org_admin' AND organization_id = get_user_organization_id())
    ) -- Org admin can update feedback within their organization
    OR 
    (get_user_role_key() = 'super_admin') -- Super admin can update all feedback
);

-- Policy 4: DELETE - Only super_admin can delete feedback
CREATE POLICY "Allow super_admin to delete feedback"
ON user_feedback_testing FOR DELETE
TO public
USING (get_user_role_key() = 'super_admin');

-- Insert some test data (this will help verify the policies work)
-- Note: This will only work if you run this while authenticated as a user
-- You can comment this out if you prefer to test manually

-- Test the policies by trying to insert data
-- INSERT INTO user_feedback_testing (
--     user_id,
--     organization_id,
--     page_url,
--     page_route,
--     what_you_like,
--     what_needs_improving,
--     new_features_needed,
--     session_id,
--     user_agent
-- ) VALUES (
--     auth.uid(),
--     get_user_organization_id(),
--     'https://localhost:5173/calls',
--     'Sales Calls',
--     'Great interface',
--     'Could be faster',
--     'More automation',
--     'test_session_' || extract(epoch from now()),
--     'Test User Agent'
-- );