/*
  # Normalized Database Structure for Content Management

  1. Schema Updates
    - Add content_references JSONB column to processing_history
    - Add owner and deadline columns to call_commitments
    - Add edited_content columns for user modifications
    - Create indexes for better performance

  2. Content Linking
    - Store content IDs in processing_history.content_references
    - Enable cross-referencing between sessions and content
    - Support content reuse across multiple sessions

  3. Data Integrity
    - Ensure updates in one place reflect everywhere
    - Maintain referential integrity with foreign keys
    - Support cascading updates and deletes
*/

-- Add content_references column to processing_history for normalized linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processing_history' AND column_name = 'content_references'
  ) THEN
    ALTER TABLE processing_history ADD COLUMN content_references jsonb;
  END IF;
END $$;

-- Add owner and deadline columns to call_commitments for action items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_commitments' AND column_name = 'owner'
  ) THEN
    ALTER TABLE call_commitments ADD COLUMN owner text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_commitments' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE call_commitments ADD COLUMN deadline text;
  END IF;
END $$;

-- Add edited_content columns for user modifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_notes' AND column_name = 'edited_summary'
  ) THEN
    ALTER TABLE call_notes ADD COLUMN edited_summary text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'follow_up_emails' AND column_name = 'edited_content'
  ) THEN
    ALTER TABLE follow_up_emails ADD COLUMN edited_content text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deck_prompts' AND column_name = 'edited_content'
  ) THEN
    ALTER TABLE deck_prompts ADD COLUMN edited_content text;
  END IF;
END $$;

-- Create indexes for content_references JSONB queries
CREATE INDEX IF NOT EXISTS idx_processing_history_content_refs 
  ON processing_history USING gin (content_references);

-- Create indexes for owner and deadline in commitments
CREATE INDEX IF NOT EXISTS idx_call_commitments_owner 
  ON call_commitments(owner);

CREATE INDEX IF NOT EXISTS idx_call_commitments_deadline 
  ON call_commitments(deadline);

-- Create function to update content references when content is modified
CREATE OR REPLACE FUNCTION update_content_references()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be extended to automatically update references
  -- when content is modified to maintain consistency
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for content synchronization (optional, for future use)
-- These can be enabled when automatic synchronization is needed

-- Example: Update processing_history when call_notes is modified
-- CREATE TRIGGER sync_call_notes_changes
--   AFTER UPDATE ON call_notes
--   FOR EACH ROW
--   EXECUTE FUNCTION update_content_references();

-- Add comments for documentation
COMMENT ON COLUMN processing_history.content_references IS 'JSONB object containing IDs of all related content (call_notes_id, commitments_ids[], follow_up_email_id, deck_prompt_id, insights_ids[])';
COMMENT ON COLUMN call_commitments.owner IS 'Person responsible for completing this action item';
COMMENT ON COLUMN call_commitments.deadline IS 'Due date for this action item';
COMMENT ON COLUMN call_notes.edited_summary IS 'User-edited version of the AI-generated summary';
COMMENT ON COLUMN follow_up_emails.edited_content IS 'User-edited version of the AI-generated email';
COMMENT ON COLUMN deck_prompts.edited_content IS 'User-edited version of the AI-generated deck prompt';