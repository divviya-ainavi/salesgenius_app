/*
  # Setup Supabase Authentication System

  1. Authentication Setup
    - Enable Supabase Auth
    - Create trigger to auto-create profiles
    - Setup RLS policies for profiles

  2. User Management
    - Auto-create profile when user signs up
    - Link profiles to auth.users
    - Proper RLS policies
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read other profiles (for organization features)
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update user_feedback_testing policies to work with authenticated users
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_feedback_testing;

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Allow authenticated users to insert feedback"
  ON user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read their own feedback
CREATE POLICY "Allow users to read own feedback"
  ON user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow users to update their own feedback
CREATE POLICY "Allow users to update own feedback"
  ON user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own feedback
CREATE POLICY "Allow users to delete own feedback"
  ON user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());