-- Add a 'public' flag to deployments table
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create a marketplace_listings table for published servers
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  version VARCHAR(50),
  stars INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  installation_instructions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a marketplace_capabilities table to store capabilities
CREATE TABLE IF NOT EXISTS marketplace_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('resource', 'tool')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for marketplace_listings
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Allow users to view all public listings
CREATE POLICY marketplace_listings_select_policy
  ON marketplace_listings FOR SELECT
  USING (true);

-- Allow users to insert their own listings
CREATE POLICY marketplace_listings_insert_policy
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own listings
CREATE POLICY marketplace_listings_update_policy
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own listings
CREATE POLICY marketplace_listings_delete_policy
  ON marketplace_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for marketplace_capabilities
ALTER TABLE marketplace_capabilities ENABLE ROW LEVEL SECURITY;

-- Allow users to view all capabilities
CREATE POLICY marketplace_capabilities_select_policy
  ON marketplace_capabilities FOR SELECT
  USING (true);

-- Allow users to insert capabilities for their own listings
CREATE POLICY marketplace_capabilities_insert_policy
  ON marketplace_capabilities FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  );

-- Allow users to update capabilities for their own listings
CREATE POLICY marketplace_capabilities_update_policy
  ON marketplace_capabilities FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete capabilities for their own listings
CREATE POLICY marketplace_capabilities_delete_policy
  ON marketplace_capabilities FOR DELETE
  USING (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  );
