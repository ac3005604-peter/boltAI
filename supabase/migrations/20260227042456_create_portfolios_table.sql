
/*
  # Create portfolios table

  1. New Tables
    - `portfolios`
      - `id` (uuid, primary key)
      - `filename` (text, unique identifier for storage)
      - `original_name` (text, display name)
      - `type` (text, 'resume' or 'portfolio')
      - `status` (text, 'active' or 'deleted')
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `portfolios` table
    - Create policy for public read-only access to active items
*/

CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL UNIQUE,
  original_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('resume', 'portfolio')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active portfolios"
  ON portfolios
  FOR SELECT
  USING (status = 'active');
