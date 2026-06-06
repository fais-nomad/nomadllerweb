-- Run this script in the Supabase SQL Editor

-- 1. Create abc_locations table
CREATE TABLE IF NOT EXISTS abc_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create abc_accommodations table
CREATE TABLE IF NOT EXISTS abc_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES abc_locations(id) ON DELETE CASCADE,
    hotel_name TEXT NOT NULL,
    room_type TEXT,
    price_per_night NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE abc_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_accommodations ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow public access (adjust as needed for prod)
CREATE POLICY "Allow public access on abc_locations" 
ON abc_locations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on abc_accommodations" 
ON abc_accommodations FOR ALL USING (true) WITH CHECK (true);
