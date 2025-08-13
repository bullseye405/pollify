/*
  # Create Pollify Database Schema

  1. New Tables
    - `pollify_polls`
      - `id` (uuid, primary key)
      - `question` (text)
      - `allow_multiple` (boolean, default false)
      - `require_name_email` (boolean, default true)
      - `active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `pollify_poll_options`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key)
      - `option_text` (text)
      - `created_at` (timestamp)
    
    - `pollify_votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key)
      - `option_id` (uuid, foreign key)
      - `name` (text, nullable)
      - `email` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for inserting votes only on active polls
*/

-- Create pollify_polls table
CREATE TABLE IF NOT EXISTS pollify_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  allow_multiple boolean DEFAULT false,
  require_name_email boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create pollify_poll_options table
CREATE TABLE IF NOT EXISTS pollify_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES pollify_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create pollify_votes table
CREATE TABLE IF NOT EXISTS pollify_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES pollify_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES pollify_poll_options(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pollify_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollify_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollify_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for pollify_polls
CREATE POLICY "Allow public read access to polls"
  ON pollify_polls
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to polls"
  ON pollify_polls
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for pollify_poll_options
CREATE POLICY "Allow public read access to poll options"
  ON pollify_poll_options
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to poll options"
  ON pollify_poll_options
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for pollify_votes
CREATE POLICY "Allow public read access to votes"
  ON pollify_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to votes on active polls"
  ON pollify_votes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pollify_polls 
      WHERE id = poll_id AND active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pollify_poll_options_poll_id ON pollify_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_pollify_votes_poll_id ON pollify_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_pollify_votes_option_id ON pollify_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_pollify_polls_active ON pollify_polls(active);
CREATE INDEX IF NOT EXISTS idx_pollify_polls_created_at ON pollify_polls(created_at DESC);