/*
  # User Management Schema with Roles and Organizations

  1. New Tables
    - `roles` - Define user roles (super_admin, org_admin, sales_manager, etc.)
    - `user_status` - Define user status types (active, inactive, suspended)
    - `organizations` - Company/organization information
    - Update `profiles` table to use new structure

  2. Sample Data
    - Insert default roles (super_admin, org_admin, sales_manager)
    - Insert default user statuses
    - Create demo organization
    - Update existing demo users to use new structure

  3. Security
    - Enable RLS on all new tables
    - Add policies for proper access control
    - Maintain existing demo user access
*/

-- ============================================
-- 1. LOOKUP TABLES
-- ============================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_assignable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_status table
CREATE TABLE IF NOT EXISTS user_status (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  company_size TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  email TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- 3. UPDATE PROFILES TABLE
-- ============================================

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Add role_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role_id UUID REFERENCES roles(id);
  END IF;

  -- Add organization_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT REFERENCES user_status(key) DEFAULT 'active';
  END IF;

  -- Add timezone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;

  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
END $$;

-- ============================================
-- 4. INSERT SAMPLE DATA
-- ============================================

-- Insert default user statuses
INSERT INTO user_status (key, label, is_active) VALUES
  ('active', 'Active', true),
  ('inactive', 'Inactive', false),
  ('suspended', 'Suspended', false),
  ('pending', 'Pending Activation', true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active;

-- Insert default roles
INSERT INTO roles (id, key, label, description, is_assignable) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'super_admin', 'Super Administrator', 'Full system access across all organizations', true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'org_admin', 'Organization Administrator', 'Full access within their organization', true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'sales_manager', 'Sales Manager', 'Sales team management and analytics access', true),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'sales_rep', 'Sales Representative', 'Individual sales activities and basic analytics', true),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'user', 'Standard User', 'Basic platform access', true)
ON CONFLICT (id) DO UPDATE SET
  key = EXCLUDED.key,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_assignable = EXCLUDED.is_assignable;

-- Insert demo organization
INSERT INTO organizations (id, name, domain, industry, company_size) VALUES
  ('demo-org-001'::uuid, 'Demo Sales Company', 'demosales.com', 'Technology', '50-200 employees')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  industry = EXCLUDED.industry,
  company_size = EXCLUDED.company_size;

-- Update existing demo profiles with new structure
UPDATE profiles SET
  full_name = CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN 'Super Administrator'
    WHEN id = '00000000-0000-0000-0000-000000000002'::uuid THEN 'Organization Admin'
    WHEN id = '00000000-0000-0000-0000-000000000003'::uuid THEN 'Sarah Johnson'
    ELSE full_name
  END,
  role_id = CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN '00000000-0000-0000-0000-000000000001'::uuid
    WHEN id = '00000000-0000-0000-0000-000000000002'::uuid THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN id = '00000000-0000-0000-0000-000000000003'::uuid THEN '00000000-0000-0000-0000-000000000003'::uuid
    ELSE role_id
  END,
  organization_id = CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN NULL -- Super admin has no org
    WHEN id = '00000000-0000-0000-0000-000000000002'::uuid THEN 'demo-org-001'::uuid
    WHEN id = '00000000-0000-0000-0000-000000000003'::uuid THEN 'demo-org-001'::uuid
    ELSE organization_id
  END,
  status = 'active',
  timezone = 'America/New_York',
  language = 'en'
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Roles policies (read-only for most users)
CREATE POLICY "Anyone can read roles" ON roles
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Super admins can manage roles" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key = 'super_admin'
    )
  );

-- User status policies (read-only for most users)
CREATE POLICY "Anyone can read user status" ON user_status
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Super admins can manage user status" ON user_status
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key = 'super_admin'
    )
  );

-- Organizations policies
CREATE POLICY "Users can read their organization" ON organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key = 'super_admin'
    )
  );

CREATE POLICY "Org admins can update their organization" ON organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT p.organization_id FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key IN ('org_admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage all organizations" ON organizations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key = 'super_admin'
    )
  );

-- Invites policies
CREATE POLICY "Org admins can manage invites for their org" ON invites
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.key IN ('org_admin', 'super_admin')
    )
  );

-- Demo user policies for new tables
CREATE POLICY "Demo users access to roles" ON roles
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Demo users access to user_status" ON user_status
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Demo users access to organizations" ON organizations
  FOR ALL TO public
  USING (
    id = 'demo-org-001'::uuid OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id IN (
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid
      )
    )
  );

CREATE POLICY "Demo users access to invites" ON invites
  FOR ALL TO public
  USING (
    organization_id = 'demo-org-001'::uuid
  );

-- ============================================
-- 7. CREATE INDEXES
-- ============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_roles_key ON roles(key);
CREATE INDEX IF NOT EXISTS idx_invites_organization_id ON invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.key INTO user_role
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, role_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = user_id AND r.key = role_key
  );
END;
$$;

-- Function to get user organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM profiles
  WHERE id = user_id;
  
  RETURN org_id;
END;
$$;

-- ============================================
-- 9. UPDATE TRIGGERS
-- ============================================

-- Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. COMMENTS
-- ============================================

-- Add helpful comments
COMMENT ON TABLE roles IS 'User roles defining permissions and access levels';
COMMENT ON TABLE user_status IS 'User status types (active, inactive, suspended, etc.)';
COMMENT ON TABLE organizations IS 'Company/organization information';
COMMENT ON TABLE invites IS 'Pending user invitations to organizations';

COMMENT ON COLUMN profiles.role_id IS 'Reference to user role defining permissions';
COMMENT ON COLUMN profiles.organization_id IS 'Reference to user organization (null for super_admin)';
COMMENT ON COLUMN profiles.status IS 'Current user status (active, inactive, etc.)';
COMMENT ON COLUMN profiles.full_name IS 'User full display name';

COMMENT ON FUNCTION get_user_role(UUID) IS 'Returns the role key for a given user ID';
COMMENT ON FUNCTION user_has_role(UUID, TEXT) IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION get_user_organization(UUID) IS 'Returns the organization ID for a given user ID';