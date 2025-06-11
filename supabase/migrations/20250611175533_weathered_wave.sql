/*
  # Add call insights table for storing AI-generated insights

  1. New Tables
    - `call_insights`
      - `id` (uuid, primary key)
      - `call_notes_id` (uuid, foreign key to call_notes)
      - `user_id` (uuid, foreign key to profiles)
      - `insight_type` (text, type of insight)
      - `content` (text, insight content)
      - `relevance_score` (integer, relevance score 0-100)
      - `is_selected` (boolean, whether selected for follow-up)
      - `source` (text, source of insight)
      - `timestamp` (text, timestamp in call)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `call_insights` table
    - Add policies for authenticated users to manage their own insights
*/

CREATE TABLE IF NOT EXISTS call_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_notes_id uuid REFERENCES call_notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  content text NOT NULL,
  relevance_score integer DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  is_selected boolean DEFAULT true,
  source text DEFAULT 'AI Analysis',
  timestamp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE call_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for call_insights
CREATE POLICY "Users can read own insights"
  ON call_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own insights"
  ON call_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own insights"
  ON call_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own insights"
  ON call_insights
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create trigger for updated_at
CREATE TRIGGER update_call_insights_updated_at
  BEFORE UPDATE ON call_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_call_insights_call_notes_id ON call_insights(call_notes_id);
CREATE INDEX idx_call_insights_user_id ON call_insights(user_id);
CREATE INDEX idx_call_insights_relevance_score ON call_insights(relevance_score DESC);