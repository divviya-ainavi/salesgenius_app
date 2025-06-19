/*
  # Create call_insights table for storing AI-processed call data

  1. New Table
    - `call_insights` - Store AI-processed call data
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `uploaded_file_id` (uuid, foreign key to uploaded_files)
      - `company_details` (jsonb, company information)
      - `prospect_details` (jsonb, prospect information)
      - `call_summary` (text, summary of the call)
      - `action_items` (jsonb, action items from the call)
      - `sales_insights` (jsonb, sales insights from the call)
      - `communication_styles` (jsonb, communication styles detected)
      - `call_analysis_overview` (jsonb, overview of call analysis)
      - `processing_status` (text, status of processing)
      - `error_message` (text, error message if processing failed)
      - `extracted_transcript` (text, extracted transcript from the file)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, update timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for authenticated users to access their own data
    - Add policy for demo user access
*/

-- Create call_insights table
CREATE TABLE IF NOT EXISTS call_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_file_id uuid REFERENCES uploaded_files(id) ON DELETE SET NULL,
  company_details jsonb,
  prospect_details jsonb,
  call_summary text,
  action_items jsonb,
  sales_insights jsonb,
  communication_styles jsonb,
  call_analysis_overview jsonb,
  processing_status text DEFAULT 'completed',
  error_message text,
  extracted_transcript text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE call_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for call_insights
CREATE POLICY "Users can read own call insights"
  ON call_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own call insights"
  ON call_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own call insights"
  ON call_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own call insights"
  ON call_insights
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create policy for demo user
CREATE POLICY "Demo Sales Manager call insights access"
  ON call_insights
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Create trigger for updated_at
CREATE TRIGGER update_call_insights_updated_at
  BEFORE UPDATE ON call_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_call_insights_user_id ON call_insights(user_id);
CREATE INDEX idx_call_insights_uploaded_file_id ON call_insights(uploaded_file_id);
CREATE INDEX idx_call_insights_processing_status ON call_insights(processing_status);
CREATE INDEX idx_call_insights_created_at ON call_insights(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE call_insights IS 'Stores AI-processed call data including insights, action items, and communication styles';
COMMENT ON COLUMN call_insights.company_details IS 'JSON object containing company information';
COMMENT ON COLUMN call_insights.prospect_details IS 'JSON object containing prospect information';
COMMENT ON COLUMN call_insights.action_items IS 'JSON array of action items extracted from the call';
COMMENT ON COLUMN call_insights.sales_insights IS 'JSON array of sales insights extracted from the call';
COMMENT ON COLUMN call_insights.communication_styles IS 'JSON array of communication styles detected in the call';
COMMENT ON COLUMN call_insights.call_analysis_overview IS 'JSON object containing overview of call analysis';