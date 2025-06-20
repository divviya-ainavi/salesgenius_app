/*
  # Restore Profiles RLS Policies

  1. Security
    - Enable RLS on profiles table
    - Restore essential policies for user authentication
    - Add demo user access for testing

  2. Schema Updates
    - Add missing columns for authentication flow
    - Update demo user data

  3. Policies
    - Users can read their own profile
    - Users can update their own profile
    - Allow profile operations for OTP verification
    - Demo Sales Manager access
*/

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile operations for OTP verification" ON profiles;
DROP POLICY IF EXISTS "Demo Sales Manager profile access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON profiles;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for OTP verification (allows public access for verification flow)
CREATE POLICY "Allow profile operations for OTP verification"
  ON profiles
  FOR ALL
  TO public
  USING (true);

-- Create policy for demo Sales Manager access
CREATE POLICY "Demo Sales Manager profile access"
  ON profiles
  FOR ALL
  TO public
  USING (id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Create policy for authenticated users to manage their own profile
CREATE POLICY "Authenticated users can manage own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (email = (jwt() ->> 'email'::text))
  WITH CHECK (email = (jwt() ->> 'email'::text));

-- Add password_hash column if it doesn't exist (for custom auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_hash text;
  END IF;
END $$;

-- Add full_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;
END $$;

-- Add OTP fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'otp_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN otp_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'otp_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN otp_expires_at timestamptz;
  END IF;
END $$;

-- Update demo user with password for testing
UPDATE profiles
SET 
  password_hash = 'demo123',
  full_name = 'Demo Sales Manager'
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid;