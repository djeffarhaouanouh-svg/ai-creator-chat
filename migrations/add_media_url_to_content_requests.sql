-- Migration: Add media_url column to content_requests table

-- Add media_url column if it doesn't exist
ALTER TABLE content_requests 
  ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Update comment
COMMENT ON COLUMN content_requests.media_url IS 'URL of the delivered media content';

