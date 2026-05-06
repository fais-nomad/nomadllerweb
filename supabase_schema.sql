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
