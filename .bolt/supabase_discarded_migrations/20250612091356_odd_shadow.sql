/*
  # Add public insert policy for call_notes table

  1. Security Changes
    - Add temporary policy to allow public inserts to call_notes table
    - This enables the demo functionality while maintaining data isolation
    - Users can only read/update their own records via existing policies

  Note: This is a temporary solution for demo purposes. In production, 
  proper authentication should be implemented.
*/

-- Add policy to allow public inserts (for demo purposes)
CREATE POLICY "Allow public inserts for demo"
  ON call_notes
  FOR INSERT
  TO public
  WITH CHECK (true);