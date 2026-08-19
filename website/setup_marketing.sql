-- Drop tables if they exist (optional, be careful in production)
-- DROP TABLE IF EXISTS marketing_leads;
-- DROP TABLE IF EXISTS campaigns;

-- 1. Create Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY, -- e.g., 'decathlon-ebc'
    name TEXT NOT NULL,
    success_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Marketing Leads Table
CREATE TABLE IF NOT EXISTS marketing_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL UNIQUE,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
-- Allow public access for now since admin login uses anon key
DROP POLICY IF EXISTS "Enable read access for all users on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Enable all access for authenticated users on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Enable all access for all users on campaigns" ON campaigns;

CREATE POLICY "Enable all access for all users on campaigns"
    ON campaigns FOR ALL
    USING (true)
    WITH CHECK (true);

-- Marketing Leads Policies
-- Allow public access for all users on marketing_leads
DROP POLICY IF EXISTS "Enable insert for all users on marketing_leads" ON marketing_leads;
DROP POLICY IF EXISTS "Enable all access for authenticated users on marketing_leads" ON marketing_leads;
DROP POLICY IF EXISTS "Enable all access for all users on marketing_leads" ON marketing_leads;

CREATE POLICY "Enable all access for all users on marketing_leads"
    ON marketing_leads FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Seed the initial Decathlon campaign
INSERT INTO campaigns (id, name, success_message)
VALUES (
    'decathlon-ebc',
    'Decathlon Everest Base Camp Collaboration',
    'You got 15000 flat discount one everest base camp trek in Nov 1 , now you can avil 93000 package just for 78000'
) ON CONFLICT (id) DO NOTHING;
