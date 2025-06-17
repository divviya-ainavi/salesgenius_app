/*
  # Add is_processed field to uploaded_files table

  1. Changes
    - Add is_processed boolean field to uploaded_files table with default value of false
    - This field will be used to track whether a file has been processed or not
*/

-- Add is_processed field to uploaded_files table
ALTER TABLE public.uploaded_files 
ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_files_is_processed 
ON public.uploaded_files (is_processed);