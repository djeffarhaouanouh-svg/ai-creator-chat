-- Migration: Add last_login column to creators table
-- This allows tracking when creators last logged in

-- Add last_login column if it doesn't exist
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN creators.last_login IS 'Timestamp of the last login by the creator';

