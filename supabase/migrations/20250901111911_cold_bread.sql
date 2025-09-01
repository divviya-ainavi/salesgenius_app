/*
  # Add RLS policies for business_knowledge_org table

  1. Security Updates
    - Add policy for org admin full access to their organization's business knowledge
    - Add policy for users to read business knowledge from their organization
    - Maintain existing policies for user access and super admin access

  2. Policy Details
    - Org admins can perform all operations (SELECT, INSERT, UPDATE, DELETE) on business knowledge for their organization
    - Regular users can only read (SELECT) business knowledge from their organization
    - Super admins retain full access to all business knowledge
*/

-- Policy for org admin full access to their organization's business knowledge
CREATE POLICY "Org admin full access to org business knowledge"
  ON business_knowledge_org
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND p.organization_id = business_knowledge_org.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND p.organization_id = business_knowledge_org.organization_id
    )
  );

-- Policy for users to read business knowledge from their organization
CREATE POLICY "Users can read org business knowledge"
  ON business_knowledge_org
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.auth_user_id = auth.uid()
        AND p.organization_id = business_knowledge_org.organization_id
    )
  );