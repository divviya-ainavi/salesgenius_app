/*
  # Create feedback system

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `username` (text)
      - `page_url` (text)
      - `page_route` (text)
      - `what_you_like` (text)
      - `what_needs_improving` (text)
      - `new_features_needed` (text)
      - `session_id` (text)
      - `user_agent` (text)
      - `created_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `user_feedback` table
    - Add policy for authenticated users to insert their own feedback
    - Add policy for super admins to read all feedback
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  page_url text NOT NULL,
  page_route text NOT NULL,
  what_you_like text,
  what_needs_improving text,
  new_features_needed text,
  session_id text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to read their own feedback
CREATE POLICY "Users can read own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for super admins to read all feedback (userRoleId is null for super admins)
CREATE POLICY "Super admins can read all feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.title_id IS NULL
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_page_route ON user_feedback(page_route);
CREATE INDEX IF NOT EXISTS idx_user_feedback_is_active ON user_feedback(is_active);