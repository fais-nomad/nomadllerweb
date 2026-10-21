-- Supabase SQL Migration for College Trip Portal & Parent Tracking System
-- Execute this in your Supabase SQL Editor (https://supabase.com/dashboard/project/tfrnasqulivfzmyfskqy/sql)

-- 1. Create college_trips table
CREATE TABLE IF NOT EXISTS college_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code TEXT UNIQUE NOT NULL,
    college_name TEXT NOT NULL,
    trip_title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coordinator_name TEXT,
    coordinator_phone TEXT,
    guide_name TEXT,
    guide_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create college_updates table
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

-- 5. Open access policies for web application
CREATE POLICY "Allow public all access on college_trips" 
ON college_trips FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on college_students" 
ON college_students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on college_updates" 
ON college_updates FOR ALL USING (true) WITH CHECK (true);

-- 6. Insert Default College Trip for Demonstration
INSERT INTO college_trips (trip_code, college_name, trip_title, destination, start_date, end_date, coordinator_name, coordinator_phone, guide_name, guide_phone)
VALUES (
    'NOMAD-COLLEGE-2026',
    'College of Engineering & Technology',
    'Annual Himalayan & Western Ghats Expedition',
    'Manali - Solang - Kasol Valley',
    '2026-11-10',
    '2026-11-15',
    'Prof. K. Rajagopal (HOD)',
    '+91 98470 12345',
    'Arjun Negi (Nomadller Chief Guide)',
    '+91 62389 98382'
) ON CONFLICT (trip_code) DO NOTHING;

-- 7. Insert Initial Sample Updates
INSERT INTO college_updates (trip_code, title, description, location_name, update_type, posted_by)
VALUES 
(
    'NOMAD-COLLEGE-2026',
    'Trip Flag-Off & Campus Departure',
    'All luxury AC coaches have departed from the college campus after morning roll call. Group spirits are high!',
    'College Main Campus Gate',
    'Departure',
    'Prof. K. Rajagopal'
),
(
    'NOMAD-COLLEGE-2026',
    'Breakfast Refreshment Halt',
    'Coaches stopped at Highway Grand for clean buffet breakfast and tea. All 48 students accounted for.',
    'Highway Grand Express Plaza',
    'Meal',
    'Arjun Negi'
),
(
    'NOMAD-COLLEGE-2026',
    'Basecamp Arrival & Room Check-in',
    'Group reached Himalayan Pine Resort safely. Rooms and tents allocated. Evening safety briefing at 7:00 PM.',
    'Himalayan Pine Resort, Solang',
    'Hotel',
    'Prof. K. Rajagopal'
);
