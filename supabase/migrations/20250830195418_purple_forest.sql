/*
  # Fix RLS policies for business_knowledge_org table

  1. Security Updates
    - Add proper RLS policies for INSERT, SELECT, UPDATE, DELETE operations
    - Allow users to insert their own data
    - Allow org admins to access org data
    - Allow super admins full access

  2. Policy Details
    - Users can insert data for their own organization
    - Users can read their own data
    - Org admins can access all data within their organization
    - Super admins have full access
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own business knowledge" ON business_knowledge_org;
DROP POLICY IF EXISTS "Users can read own business knowledge" ON business_knowledge_org;
DROP POLICY IF EXISTS "Org admin can access org business knowledge" ON business_knowledge_org;
DROP POLICY IF EXISTS "Super admin has full access to business knowledge" ON business_knowledge_org;

-- Enable RLS on the table
ALTER TABLE business_knowledge_org ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own business knowledge data
CREATE POLICY "Users can insert own business knowledge"
  ON business_knowledge_org
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND organization_id = (SELECT organization_id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Policy for users to read their own business knowledge data
CREATE POLICY "Users can read own business knowledge"
  ON business_knowledge_org
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Policy for users to update their own business knowledge data
CREATE POLICY "Users can update own business knowledge"
  ON business_knowledge_org
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Policy for org admins to access all business knowledge data within their organization
CREATE POLICY "Org admin can access org business knowledge"
  ON business_knowledge_org
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND p.organization_id = business_knowledge_org.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND p.organization_id = business_knowledge_org.organization_id
    )
  );

-- Policy for super admins to have full access
CREATE POLICY "Super admin has full access to business knowledge"
  ON business_knowledge_org
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'super_admin'
    )
  );