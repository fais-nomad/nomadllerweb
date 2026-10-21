-- Supabase SQL Migration for Dynamic College Trip, Checkpoints & Parent Tracker
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/tfrnasqulivfzmyfskqy/sql

-- 1. Create dynamic college_trips table with JSONB support for plan, inclusions & itinerary
CREATE TABLE IF NOT EXISTS college_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code TEXT UNIQUE NOT NULL,
    college_name TEXT NOT NULL,
    trip_title TEXT NOT NULL,
    destination TEXT NOT NULL,
    dates TEXT NOT NULL,
    duration TEXT NOT NULL,
    coaches TEXT,
    lead_faculty TEXT,
    faculty_phone TEXT,
    nomad_guide TEXT,
    nomad_phone TEXT,
    emergency_helpline TEXT,
    itinerary_data JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    packing_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create college_students table
CREATE TABLE IF NOT EXISTS college_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code TEXT NOT NULL,
    name TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    department TEXT,
    phone TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    blood_group TEXT,
    food_preference TEXT,
    bus_no TEXT DEFAULT 'Bus 1',
    room_no TEXT DEFAULT 'Room 101',
    status TEXT DEFAULT 'Present',
    last_update TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create college_updates table for broadcast announcements
CREATE TABLE IF NOT EXISTS college_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_name TEXT NOT NULL,
    update_type TEXT DEFAULT 'Milestone',
    posted_by TEXT DEFAULT 'Faculty Lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE college_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_updates ENABLE ROW LEVEL SECURITY;

-- 5. Open access policies for seamless client-side CRUD
DROP POLICY IF EXISTS "Allow public all access on college_trips" ON college_trips;
CREATE POLICY "Allow public all access on college_trips" 
ON college_trips FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on college_students" ON college_students;
CREATE POLICY "Allow public all access on college_students" 
ON college_students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on college_updates" ON college_updates;
CREATE POLICY "Allow public all access on college_updates" 
ON college_updates FOR ALL USING (true) WITH CHECK (true);
