/*
  # Add function to update communication style role

  1. New Functions
    - `update_communication_style_role` - Updates the role field for a specific communication style
*/

-- Create function to update communication style role
CREATE OR REPLACE FUNCTION update_communication_style_role(
  style_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE communication_styles
  SET role = new_role
  WHERE id = style_id;
  
  RETURN FOUND;
END;
$$;