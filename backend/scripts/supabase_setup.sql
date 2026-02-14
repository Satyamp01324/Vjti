-- Supabase Database Setup Script
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create a simple items table for testing
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert some sample data
INSERT INTO items (name, description) VALUES
  ('Test Item 1', 'This is a test item created from SQL'),
  ('Test Item 2', 'Another test item for demonstration'),
  ('Sample Product', 'A sample product entry'),
  ('Demo Entry', 'Demo entry to test Supabase connection');

-- 3. Enable Row Level Security (RLS) - Important for production!
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy to allow read access (for testing)
-- WARNING: This allows anyone to read. Adjust for production!
CREATE POLICY "Allow public read access" 
  ON items 
  FOR SELECT 
  USING (true);

-- 5. Create a policy to allow insert access (for testing)
-- WARNING: This allows anyone to insert. Adjust for production!
CREATE POLICY "Allow public insert access" 
  ON items 
  FOR INSERT 
  WITH CHECK (true);

-- 6. Verify the table was created
SELECT * FROM items;

-- Optional: Create a more complex table for a real app
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
  ON users_profile 
  FOR SELECT 
  USING (true);
