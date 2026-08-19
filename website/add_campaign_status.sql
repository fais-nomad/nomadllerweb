-- Run this in your Supabase SQL Editor to add the 'status' column
-- needed for Stop/Resume campaign functionality.

-- Add status column to campaigns table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'status'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;
