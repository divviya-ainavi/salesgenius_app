/*
  # SalesGenius.ai Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `hubspot_access_token` (text, encrypted)
      - `hubspot_refresh_token` (text, encrypted)
      - `hubspot_connected` (boolean)

    - `call_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `call_id` (text)
      - `transcript_content` (text)
      - `ai_summary` (text)
      - `edited_summary` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `call_commitments`
      - `id` (uuid, primary key)
      - `call_notes_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `commitment_text` (text)
      - `is_selected` (boolean)
      - `is_pushed` (boolean)
      - `created_at` (timestamp)

    - `follow_up_emails`
      - `id` (uuid, primary key)
      - `call_notes_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `email_content` (text)
      - `edited_content` (text)
      - `is_pushed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `deck_prompts`
      - `id` (uuid, primary key)
      - `call_notes_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `prompt_content` (text)
      - `edited_content` (text)
      - `is_pushed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `push_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `content_type` (text)
      - `content_id` (uuid)
      - `push_status` (text)
      - `error_message` (text)
      - `hubspot_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hubspot_access_token text,
  hubspot_refresh_token text,
  hubspot_connected boolean DEFAULT false
);

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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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