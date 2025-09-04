/*
  # Add RLS policies for business_knowledge_personal table

  1. Security
    - Enable RLS on business_knowledge_personal table
    - Add policy for users to access their own data
    - Add policy for org admins to access their organization users' data
    - Add policy for super admins to access all data

  2. Policies
    - Users can read/write their own personal insights
    - Org admins can read/write personal insights for users in their organization
    - Super admins have full access to all personal insights
*/

-- Enable RLS on business_knowledge_personal table
ALTER TABLE business_knowledge_personal ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own personal insights data
CREATE POLICY "Users can access own personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Policy: Org admins can access personal insights for users in their organization
CREATE POLICY "Org admin can access org users personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND EXISTS (
          SELECT 1
          FROM profiles p2
          WHERE p2.id = business_knowledge_personal.user_id
            AND p2.organization_id = p1.organization_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p1
      JOIN titles t ON p1.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p1.auth_user_id = auth.uid()
        AND r.key = 'org_admin'
        AND EXISTS (
          SELECT 1
          FROM profiles p2
          WHERE p2.id = business_knowledge_personal.user_id
            AND p2.organization_id = p1.organization_id
        )
    )
  );

-- Policy: Super admins have full access to all personal insights
CREATE POLICY "Super admin full access to personal insights"
  ON business_knowledge_personal
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
        AND r.key = 'super_admin'
    )
  );