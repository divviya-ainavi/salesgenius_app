/*
  # Fix RLS policies for user_feedback_testing table

  1. Drop existing policies that may be too restrictive
  2. Create simpler, more reliable policies
  3. Test with basic authentication checks first
*/

-- Drop all existing policies on user_feedback_testing
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON public.user_feedback_testing;
DROP POLICY IF EXISTS "Allow feedback update access based on role and ownership" ON public.user_feedback_testing;
DROP POLICY IF EXISTS "Allow super_admin to delete feedback" ON public.user_feedback_testing;
DROP POLICY IF EXISTS "Allow users to read own feedback and admins to read all" ON public.user_feedback_testing;

-- Create a very simple INSERT policy first (just authentication check)
CREATE POLICY "Simple insert for authenticated users"
  ON public.user_feedback_testing
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create a simple SELECT policy (users can read their own feedback)
CREATE POLICY "Users can read own feedback"
  ON public.user_feedback_testing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create a simple UPDATE policy (users can update their own feedback)
CREATE POLICY "Users can update own feedback"
  ON public.user_feedback_testing
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a simple DELETE policy (users can delete their own feedback)
CREATE POLICY "Users can delete own feedback"
  ON public.user_feedback_testing
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());