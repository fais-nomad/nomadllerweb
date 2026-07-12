-- 1. Create campaign_codes table
CREATE TABLE IF NOT EXISTS campaign_codes (
    code TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update marketing_leads to link to the specific code
-- We'll add a column if it doesn't exist, and we'll drop the unique constraint on coupon_code if we want to rely on the new table, or we just map it.
-- We can just rely on campaign_codes to track usage, so we'll leave marketing_leads as is, but maybe add campaign_code foreign key.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_leads' AND column_name = 'used_campaign_code') THEN
        ALTER TABLE marketing_leads ADD COLUMN used_campaign_code TEXT REFERENCES campaign_codes(code);
    END IF;
END $$;

-- 3. Set up Row Level Security (RLS)
ALTER TABLE campaign_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for all users on campaign_codes" ON campaign_codes;

-- Allow public access for now since admin login uses anon key
CREATE POLICY "Enable all access for all users on campaign_codes"
    ON campaign_codes FOR ALL
    USING (true)
    WITH CHECK (true);
