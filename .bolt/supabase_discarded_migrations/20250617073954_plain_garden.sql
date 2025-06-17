/*
  # User Management Schema Implementation

  1. New Tables
    - `roles` - Define user roles with serial IDs
    - `user_status` - Define user status types with serial IDs
    - `organizations` - Company/organization information
    - Update `profiles` table to use new structure

  2. Sample Data
    - Insert default roles (super_admin, org_admin, user)
    - Insert default user statuses (active, invited, suspended, deactivated)
    - Create sample organizations
    - Update existing profiles to use new structure

  3. Security
    - Enable RLS on all new tables
    - Add policies for proper access control
*/

-- ============================================
-- 1. MASTER & LOOKUP TABLES
-- ============================================

-- Create roles table with serial IDs
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,       -- e.g., 'super_admin', 'org_admin', 'user'
  label TEXT NOT NULL,
  description TEXT,
  is_assignable BOOLEAN DEFAULT TRUE
);

-- Insert default roles
INSERT INTO roles (key, label, description, is_assignable) VALUES
  ('super_admin', 'Super Admin', 'Full access to all organizations and settings', FALSE),
  ('org_admin', 'Org Admin', 'Manages users and content within their organization', TRUE),
  ('user', 'User', 'Standard user with limited access', TRUE)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_assignable = EXCLUDED.is_assignable;

-- Create user_status table with serial IDs
CREATE TABLE IF NOT EXISTS user_status (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,       -- e.g., 'active', 'suspended'
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert default user statuses
INSERT INTO user_status (key, label, is_active) VALUES
  ('active', 'Active', TRUE),
  ('invited', 'Invited', TRUE),
  ('suspended', 'Suspended', FALSE),
  ('deactivated', 'Deactivated', FALSE)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active;

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
  status_id INT REFERENCES user_status(id) DEFAULT 1, -- 1 = 'active'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample organizations
INSERT INTO organizations (id, name, domain, industry, company_size, status_id) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Acme Corp', 'acme.com', 'Technology', '51-200', 1),      -- active
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Globex Inc', 'globex.com', 'Consulting', '201-500', 1),  -- active
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Initech', 'initech.com', 'Finance', '11-50', 2),         -- invited
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Umbrella Corp', 'umbrella.com', 'Healthcare', '500+', 3) -- suspended
ON CONFLICT (id) DO NOTHING;

-- Update demo organization to match sample data
UPDATE organizations 
SET 
  name = 'Acme Corp',
  domain = 'acme.com',
  industry = 'Technology',
  company_size = '51-200',
  status_id = 1
WHERE id = 'demo-org-001'::uuid;

-- ============================================
-- 3. UPDATE PROFILES TABLE
-- ============================================

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add organization_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;

  -- Add status_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'status_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status_id INT REFERENCES user_status(id) DEFAULT 1;
  END IF;
END $$;

-- Update existing profiles to use new structure
UPDATE profiles SET
  status_id = 1 -- Set all existing profiles to 'active'
WHERE status_id IS NULL;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Roles policies
CREATE POLICY "Anyone can read roles" ON roles
  FOR SELECT TO public
  USING (true);

-- User status policies
CREATE POLICY "Anyone can read user status" ON user_status
  FOR SELECT TO public
  USING (true);

-- Organizations policies
CREATE POLICY "Users can read organizations" ON organizations
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role_id = 1 -- super_admin role_id = 1
    )
  );

CREATE POLICY "Org admins can update their organization" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role_id = 2 AND p.organization_id = organizations.id -- org_admin role_id = 2
    )
  );

-- ============================================
-- 6. CREATE MAPPING BETWEEN OLD AND NEW SCHEMAS
-- ============================================

-- Create a function to map UUID role_id to serial role_id
CREATE OR REPLACE FUNCTION get_serial_role_id(uuid_role_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_key TEXT;
  serial_id INT;
BEGIN
  -- Get the role key from the UUID-based roles table
  SELECT key INTO role_key
  FROM (
    SELECT '00000000-0000-0000-0000-000000000001'::uuid as id, 'super_admin' as key
    UNION ALL
    SELECT '00000000-0000-0000-0000-000000000002'::uuid as id, 'org_admin' as key
    UNION ALL
    SELECT '00000000-0000-0000-0000-000000000003'::uuid as id, 'sales_manager' as key
    UNION ALL
    SELECT '00000000-0000-0000-0000-000000000004'::uuid as id, 'sales_rep' as key
    UNION ALL
    SELECT '00000000-0000-0000-0000-000000000005'::uuid as id, 'user' as key
  ) as uuid_roles
  WHERE id = uuid_role_id;
  
  -- Get the serial ID from the new roles table
  SELECT id INTO serial_id
  FROM roles
  WHERE key = role_key;
  
  RETURN COALESCE(serial_id, 3); -- Default to 'user' role (id=3) if not found
END;
$$;

-- Create a function to map status text to status_id
CREATE OR REPLACE FUNCTION get_status_id(status_text TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_id INT;
BEGIN
  -- Get the status ID from the user_status table
  SELECT id INTO status_id
  FROM user_status
  WHERE key = status_text;
  
  RETURN COALESCE(status_id, 1); -- Default to 'active' (id=1) if not found
END;
$$;

-- Update existing profiles to use the new serial IDs
UPDATE profiles SET
  status_id = get_status_id(status),
  role_id = get_serial_role_id(role_id::uuid)
WHERE role_id IS NOT NULL OR status IS NOT NULL;

-- ============================================
-- 7. CREATE INDEXES
-- ============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status_id ON profiles(status_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_key ON roles(key);
CREATE INDEX IF NOT EXISTS idx_user_status_key ON user_status(key);
CREATE INDEX IF NOT EXISTS idx_organizations_status_id ON organizations(status_id);

-- ============================================
-- 8. COMMENTS
-- ============================================

-- Add helpful comments
COMMENT ON TABLE roles IS 'User roles defining permissions and access levels';
COMMENT ON TABLE user_status IS 'User status types (active, invited, suspended, etc.)';
COMMENT ON TABLE organizations IS 'Company/organization information';

COMMENT ON COLUMN profiles.role_id IS 'Reference to user role defining permissions';
COMMENT ON COLUMN profiles.organization_id IS 'Reference to user organization (null for super_admin)';
COMMENT ON COLUMN profiles.status_id IS 'Reference to user status (active, invited, etc.)';

COMMENT ON FUNCTION get_serial_role_id(UUID) IS 'Maps UUID role_id to serial role_id for compatibility';
COMMENT ON FUNCTION get_status_id(TEXT) IS 'Maps status text to status_id for compatibility';