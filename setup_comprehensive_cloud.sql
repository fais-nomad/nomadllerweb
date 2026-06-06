-- Run this script in the Supabase SQL Editor

-- 1. GLOBAL TABLES (Common across all treks)

CREATE TABLE IF NOT EXISTS cloud_transport (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_name TEXT NOT NULL,
    capacity INT,
    cost_npr NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS cloud_hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location TEXT NOT NULL, -- Kathmandu, Pokhara, Beshishar, Mukthinath, etc.
    hotel_name TEXT NOT NULL,
    room_type TEXT NOT NULL,
    price_per_night NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. TREK-SPECIFIC TABLES (Linked to trek_destinations)
-- Note: Assuming trek_destinations already exists from previous script.

CREATE TABLE IF NOT EXISTS trek_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    transfer_type TEXT NOT NULL, -- 'Flight', 'Bus', 'Long Route'
    departure TEXT NOT NULL,
    arrival TEXT NOT NULL,
    vehicle_details TEXT, -- e.g., '2:1 Sofa Bus' for Bus, or Vehicle Name for Long Route
    cost NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS trek_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost_per_day NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS trek_porters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    porter_type TEXT NOT NULL, -- 'Human', 'Jokpe'
    cost_per_day NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS trek_permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    permit_name TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS trek_trail_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_id UUID REFERENCES trek_destinations(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    cost_per_day_per_person NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. ENABLE RLS
ALTER TABLE cloud_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_porters ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_trail_accommodations ENABLE ROW LEVEL SECURITY;

-- 4. PUBLIC ACCESS POLICIES
DROP POLICY IF EXISTS "Allow public access on cloud_transport" ON cloud_transport;
CREATE POLICY "Allow public access on cloud_transport" ON cloud_transport FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on cloud_hotels" ON cloud_hotels;
CREATE POLICY "Allow public access on cloud_hotels" ON cloud_hotels FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on trek_transfers" ON trek_transfers;
CREATE POLICY "Allow public access on trek_transfers" ON trek_transfers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on trek_guides" ON trek_guides;
CREATE POLICY "Allow public access on trek_guides" ON trek_guides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on trek_porters" ON trek_porters;
CREATE POLICY "Allow public access on trek_porters" ON trek_porters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on trek_permits" ON trek_permits;
CREATE POLICY "Allow public access on trek_permits" ON trek_permits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on trek_trail_accommodations" ON trek_trail_accommodations;
CREATE POLICY "Allow public access on trek_trail_accommodations" ON trek_trail_accommodations FOR ALL USING (true) WITH CHECK (true);
