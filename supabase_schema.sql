-- Run this script in the Supabase SQL Editor

-- 1. Create upcoming_trips table
CREATE TABLE IF NOT EXISTS upcoming_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    guide_name TEXT NOT NULL,
    guide_contact TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create guest_details table
CREATE TABLE IF NOT EXISTS guest_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES upcoming_trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_no TEXT NOT NULL,
    emergency_contact_no TEXT,
    blood_group TEXT,
    passport_name TEXT,
    passport_no TEXT,
    passport_expiry DATE,
    arrival_flight_no TEXT,
    arrival_dep_place TEXT,
    arrival_arr_place TEXT,
    arrival_dep_date DATE,
    arrival_arr_date DATE,
    arrival_dep_time TIME,
    arrival_arr_time TIME,
    departure_flight_no TEXT,
    departure_dep_place TEXT,
    departure_arr_place TEXT,
    departure_dep_date DATE,
    departure_arr_date DATE,
    departure_dep_time TIME,
    departure_arr_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set Row Level Security (RLS) to allow public access for now (since we use anon key without user login for guest form)
ALTER TABLE upcoming_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/insert on upcoming_trips" 
ON upcoming_trips FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/insert on guest_details" 
ON guest_details FOR ALL USING (true) WITH CHECK (true);

-- 4. Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    agent_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and allow public access for simplicity (adjust as needed for prod)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on agents" 
ON agents FOR ALL USING (true) WITH CHECK (true);

-- Add profile columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 5. Create fixed_departures table
CREATE TABLE IF NOT EXISTS fixed_departures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL,
    b2b_price TEXT NOT NULL,
    b2b_price_inr TEXT,
    max_selling_price TEXT,
    max_selling_price_inr TEXT,
    status TEXT NOT NULL,
    trip_highlights TEXT,
    detailed_itinerary TEXT,
    inclusions TEXT,
    exclusions TEXT,
    important_notes TEXT,
    things_to_remember TEXT,
    terms_and_conditions TEXT,
    risk_liabilities TEXT,
    health_and_fitness TEXT,
    travel_insurance TEXT,
    cancellation_policy TEXT,
    cover_image_url TEXT,
    map_image_url TEXT,
    altitude_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE fixed_departures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on fixed_departures" 
ON fixed_departures FOR ALL USING (true) WITH CHECK (true);
