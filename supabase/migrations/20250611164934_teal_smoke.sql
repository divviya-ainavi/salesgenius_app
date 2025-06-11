/*
  # SalesGenius.ai Database Schema - Additional Tables

  1. New Tables
    - `call_notes` - Store call transcripts and AI summaries
    - `call_commitments` - Store extracted action items from calls
    - `follow_up_emails` - Store AI-generated follow-up emails
    - `deck_prompts` - Store AI-generated presentation prompts
    - `push_log` - Log all push operations to HubSpot

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their own data

  3. Updates to existing tables
    - Add HubSpot integration fields to profiles table
*/

-- Add HubSpot fields to existing profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hubspot_access_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hubspot_access_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hubspot_refresh_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hubspot_refresh_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hubspot_connected'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hubspot_connected boolean DEFAULT false;
  END IF;
END $$;

-- Create call_notes table
CREATE TABLE IF NOT EXISTS call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  call_id text NOT NULL,
  transcript_content text,
  ai_summary text,
  edited_summary text,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create call_commitments table
CREATE TABLE IF NOT EXISTS call_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_notes_id uuid REFERENCES call_notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  commitment_text text NOT NULL,
  is_selected boolean DEFAULT true,
  is_pushed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create follow_up_emails table
CREATE TABLE IF NOT EXISTS follow_up_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_notes_id uuid REFERENCES call_notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email_content text,
  edited_content text,
  is_pushed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deck_prompts table
CREATE TABLE IF NOT EXISTS deck_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_notes_id uuid REFERENCES call_notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_content text,
  edited_content text,
  is_pushed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create push_log table
CREATE TABLE IF NOT EXISTS push_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  push_status text NOT NULL,
  error_message text,
  hubspot_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on new tables
ALTER TABLE call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;

-- Create policies for call_notes
CREATE POLICY "Users can read own call notes"
  ON call_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own call notes"
  ON call_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own call notes"
  ON call_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create policies for call_commitments
CREATE POLICY "Users can read own commitments"
  ON call_commitments
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own commitments"
  ON call_commitments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own commitments"
  ON call_commitments
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create policies for follow_up_emails
CREATE POLICY "Users can read own emails"
  ON follow_up_emails
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own emails"
  ON follow_up_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own emails"
  ON follow_up_emails
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create policies for deck_prompts
CREATE POLICY "Users can read own deck prompts"
  ON deck_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own deck prompts"
  ON deck_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own deck prompts"
  ON deck_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create policies for push_log
CREATE POLICY "Users can read own push logs"
  ON push_log
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own push logs"
  ON push_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- Create triggers for updated_at on new tables only
CREATE TRIGGER update_call_notes_updated_at
  BEFORE UPDATE ON call_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_emails_updated_at
  BEFORE UPDATE ON follow_up_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deck_prompts_updated_at
  BEFORE UPDATE ON deck_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();