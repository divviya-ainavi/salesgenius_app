/*
  # Add demo user policy for development

  1. Security
    - Add policy to allow operations for demo Sales Manager user
    - Maintain existing RLS structure for production use
    - Allow demo user to perform all CRUD operations
*/

-- Add policy for demo Sales Manager user
CREATE POLICY "Demo Sales Manager access"
  ON call_notes
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Add similar policies for other tables
CREATE POLICY "Demo Sales Manager commitments access"
  ON call_commitments
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

CREATE POLICY "Demo Sales Manager emails access"
  ON follow_up_emails
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

CREATE POLICY "Demo Sales Manager deck prompts access"
  ON deck_prompts
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

CREATE POLICY "Demo Sales Manager push log access"
  ON push_log
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

CREATE POLICY "Demo Sales Manager insights access"
  ON call_insights
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Add policy for profiles table to allow demo user operations
CREATE POLICY "Demo Sales Manager profile access"
  ON profiles
  FOR ALL
  TO public
  USING (id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000003'::uuid);