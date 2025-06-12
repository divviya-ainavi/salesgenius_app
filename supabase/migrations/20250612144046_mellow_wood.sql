/*
  # File Storage and History Enhancement

  1. New Tables
    - `uploaded_files` - Store file metadata and content
    - `processing_history` - Track processing sessions and results
    
  2. Enhanced Tables
    - Add file_id references to existing tables
    - Add processing session tracking
    
  3. Security
    - Enable RLS on new tables
    - Add policies for demo users
*/

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  file_content text, -- For text files, null for PDFs
  file_url text, -- For storing file URLs if using storage
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create processing_history table
CREATE TABLE IF NOT EXISTS processing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  file_id uuid REFERENCES uploaded_files(id) ON DELETE CASCADE,
  call_notes_id uuid REFERENCES call_notes(id) ON DELETE CASCADE,
  processing_status text DEFAULT 'processing' CHECK (processing_status IN ('processing', 'completed', 'failed')),
  api_response jsonb, -- Store full API response
  error_message text,
  processing_started_at timestamptz DEFAULT now(),
  processing_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add file_id to call_notes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_notes' AND column_name = 'file_id'
  ) THEN
    ALTER TABLE call_notes ADD COLUMN file_id uuid REFERENCES uploaded_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add processing_session_id to related tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_notes' AND column_name = 'processing_session_id'
  ) THEN
    ALTER TABLE call_notes ADD COLUMN processing_session_id uuid REFERENCES processing_history(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_commitments' AND column_name = 'processing_session_id'
  ) THEN
    ALTER TABLE call_commitments ADD COLUMN processing_session_id uuid REFERENCES processing_history(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'follow_up_emails' AND column_name = 'processing_session_id'
  ) THEN
    ALTER TABLE follow_up_emails ADD COLUMN processing_session_id uuid REFERENCES processing_history(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deck_prompts' AND column_name = 'processing_session_id'
  ) THEN
    ALTER TABLE deck_prompts ADD COLUMN processing_session_id uuid REFERENCES processing_history(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_insights' AND column_name = 'processing_session_id'
  ) THEN
    ALTER TABLE call_insights ADD COLUMN processing_session_id uuid REFERENCES processing_history(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for uploaded_files
CREATE POLICY "Users can manage own files"
  ON uploaded_files
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Demo Sales Manager files access"
  ON uploaded_files
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Create policies for processing_history
CREATE POLICY "Users can manage own processing history"
  ON processing_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Demo Sales Manager processing history access"
  ON processing_history
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000003'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_upload_date ON uploaded_files(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_processing_history_user_id ON processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_file_id ON processing_history(file_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_status ON processing_history(processing_status);
CREATE INDEX IF NOT EXISTS idx_call_notes_file_id ON call_notes(file_id);
CREATE INDEX IF NOT EXISTS idx_call_notes_processing_session ON call_notes(processing_session_id);

-- Create triggers for updated_at
CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_history_updated_at
  BEFORE UPDATE ON processing_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();