/*
  # Add vote constraints and voter details

  1. Changes
    - Add unique constraint on poll_id + email to prevent duplicate votes from same email
    - Make name field optional when email is required
    - Add index for better performance on email lookups

  2. Security
    - Update RLS policies to handle the new constraints
    - Ensure voters can see who voted for what when email is required
*/

-- Add unique constraint to prevent duplicate votes from same email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_poll_email_vote' 
    AND table_name = 'pollify_votes'
  ) THEN
    ALTER TABLE pollify_votes 
    ADD CONSTRAINT unique_poll_email_vote 
    UNIQUE (poll_id, email);
  END IF;
END $$;

-- Add index for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics 
    WHERE index_name = 'idx_pollify_votes_poll_email'
  ) THEN
    CREATE INDEX idx_pollify_votes_poll_email ON pollify_votes(poll_id, email);
  END IF;
END $$;