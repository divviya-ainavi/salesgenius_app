-- Fix RLS policy for user_feedback table to allow authenticated users to insert feedback

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;

-- Create a new, more permissive INSERT policy for authenticated users
CREATE POLICY "Allow authenticated users to insert feedback"
ON public.user_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Optional: Also update the SELECT policy to be more permissive if needed
-- This ensures users can read their own feedback without complex organization checks
DROP POLICY IF EXISTS "Allow feedback read access based on role and ownership" ON public.user_feedback;

CREATE POLICY "Allow users to read own feedback and admins to read all"
ON public.user_feedback FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- Users can read their own feedback
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN public.titles t ON p.title_id = t.id 
    JOIN public.roles r ON t.role_id = r.id 
    WHERE p.id = auth.uid() 
    AND r.key IN ('super_admin', 'org_admin')
  ) -- Admins can read all feedback
);