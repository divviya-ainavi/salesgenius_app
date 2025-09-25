/*
  # Add phone number field to profiles table

  1. Schema Changes
    - Add `phone_number` column to `profiles` table
    - Column type: text (to store international phone numbers with country codes)
    - Nullable: true (optional field)

  2. Notes
    - Phone numbers will be stored in international format (e.g., "+1234567890")
    - Field is optional, users can leave it empty
    - No validation constraints added at database level to allow flexibility
*/

-- Add phone_number column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;