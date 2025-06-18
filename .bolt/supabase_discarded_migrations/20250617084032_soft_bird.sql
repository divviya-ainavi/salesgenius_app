/*
  # User Management Schema with Roles and Organizations

  1. New Tables
    - `roles` - Define user roles with serial IDs (super_admin, org_admin, user)
    - `user_status` - Define user status types (active, invited, suspended, deactivated)
    - `organizations` - Company/organization information with status reference
    - Update `profiles` table to use new structure

  2. Sample Data
    - Insert default roles and user statuses
    - Create sample organizations
    - Update existing profiles to use new structure

  3. Security
    - Enable RLS on all tables
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

  -- Add role_id column as INT if it doesn't exist or is UUID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id' AND data_type = 'integer'
  ) THEN
    -- If role_id exists as UUID, create a temporary column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'role_id'
    ) THEN
      ALTER TABLE profiles RENAME COLUMN role_id TO role_id_old;
    END IF;
    
    -- Add new INT role_id column
    ALTER TABLE profiles ADD COLUMN role_id INT REFERENCES roles(id);
  END IF;
END $$;

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
  -- Get the role key from the UUID-based roles mapping
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
  
  -- Default to 'user' role (id=3) if not found
  -- If sales_manager, map to org_admin (id=2)
  IF role_key = 'sales_manager' THEN
    RETURN 2; -- Map to org_admin
  ELSE
    RETURN COALESCE(serial_id, 3); -- Default to 'user' role
  END IF;
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
DO $$
BEGIN
  -- Only run this if we have the old role_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id_old'
  ) THEN
    -- Update role_id based on role_id_old
    UPDATE profiles SET
      role_id = get_serial_role_id(role_id_old)
    WHERE role_id_old IS NOT NULL;
  END IF;

  -- Update status_id based on status text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    UPDATE profiles SET
      status_id = get_status_id(status)
    WHERE status IS NOT NULL;
  END IF;
END $$;

-- Update demo users with appropriate roles and organizations
UPDATE profiles SET
  role_id = CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN 1 -- super_admin
    WHEN id = '00000000-0000-0000-0000-000000000002'::uuid THEN 2 -- org_admin
    WHEN id = '00000000-0000-0000-0000-000000000003'::uuid THEN 2 -- sales_manager -> org_admin
    ELSE 3 -- user
  END,
  organization_id = CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN NULL -- super_admin has no org
    ELSE 'demo-org-001'::uuid -- others belong to demo org
  END,
  status_id = 1 -- active
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- Clean up temporary columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id_old'
  ) THEN
    ALTER TABLE profiles DROP COLUMN role_id_old;
  END IF;
END $$;

-- ============================================
-- 4. CREATE INVITES TABLE
-- ============================================

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  email TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS on invites table
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create policies for invites
CREATE POLICY "Anyone can read invites" ON invites
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Org admins can manage invites" ON invites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role_id IN (1, 2) -- super_admin or org_admin
    )
  );

-- ============================================
-- 5. CREATE INDEXES
-- ============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status_id ON profiles(status_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_key ON roles(key);
CREATE INDEX IF NOT EXISTS idx_user_status_key ON user_status(key);
CREATE INDEX IF NOT EXISTS idx_organizations_status_id ON organizations(status_id);
CREATE INDEX IF NOT EXISTS idx_invites_organization_id ON invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_invites_role_id ON invites(role_id);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

-- ============================================
-- 6. COMMENTS
-- ============================================

-- Add helpful comments
COMMENT ON TABLE roles IS 'User roles defining permissions and access levels';
COMMENT ON TABLE user_status IS 'User status types (active, invited, suspended, etc.)';
COMMENT ON TABLE organizations IS 'Company/organization information';
COMMENT ON TABLE invites IS 'Pending user invitations to organizations';

COMMENT ON COLUMN profiles.role_id IS 'Reference to user role defining permissions';
COMMENT ON COLUMN profiles.organization_id IS 'Reference to user organization (null for super_admin)';
COMMENT ON COLUMN profiles.status_id IS 'Reference to user status (active, invited, etc.)';

COMMENT ON FUNCTION get_serial_role_id(UUID) IS 'Maps UUID role_id to serial role_id for compatibility';
COMMENT ON FUNCTION get_status_id(TEXT) IS 'Maps status text to status_id for compatibility';