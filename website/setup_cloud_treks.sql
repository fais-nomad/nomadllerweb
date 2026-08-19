-- Run this script in the Supabase SQL Editor

-- 1. Create trek_destinations table (Master list of treks)
CREATE TABLE IF NOT EXISTS trek_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create trek_locations table
CREATE TABLE IF NOT EXISTS trek_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create trek_accommodations table
CREATE TABLE IF NOT EXISTS trek_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES trek_locations(id) ON DELETE CASCADE,
    hotel_name TEXT NOT NULL,
    room_type TEXT,
    price_per_night NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE trek_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_accommodations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies to allow public access (adjust as needed for prod)
CREATE POLICY "Allow public access on trek_destinations" 
ON trek_destinations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on trek_locations" 
ON trek_locations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on trek_accommodations" 
ON trek_accommodations FOR ALL USING (true) WITH CHECK (true);

-- 6. Insert initial treks
INSERT INTO trek_destinations (name, code)
VALUES 
    ('Annapurna Base Camp (ABC)', 'abc'),
    ('Everest Base Camp (EBC)', 'ebc'),
    ('Everest Base Camp with Gokyo', 'ebc-gokyo'),
    ('Annapurna Circuit', 'annapurna-circuit'),
    ('Manaslu Circuit', 'manaslu-circuit')
ON CONFLICT (code) DO NOTHING;
