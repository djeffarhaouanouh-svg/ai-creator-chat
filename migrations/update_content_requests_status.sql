-- Migration: Update content_requests status values
-- Change from: pending, priced, authorized, delivered
-- To: pending, price_proposed, paid, delivered, cancelled

-- First, update existing data
UPDATE content_requests SET status = 'price_proposed' WHERE status = 'priced';
UPDATE content_requests SET status = 'paid' WHERE status = 'authorized';

-- Drop the old constraint
ALTER TABLE content_requests DROP CONSTRAINT IF EXISTS content_requests_status_check;

-- Add the new constraint with updated status values
ALTER TABLE content_requests 
  ADD CONSTRAINT content_requests_status_check 
  CHECK (status IN ('pending', 'price_proposed', 'paid', 'delivered', 'cancelled'));

-- Update the comment
COMMENT ON COLUMN content_requests.status IS 'Request status: pending, price_proposed, paid, delivered, cancelled';

