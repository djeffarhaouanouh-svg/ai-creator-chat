-- Migration: Add paypal_order_id column to payments table
-- This column is needed to store PayPal order IDs for subscription payments

-- Add the paypal_order_id column to the payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);

-- Create an index for faster lookups by PayPal order ID
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id);

-- Add a comment for documentation
COMMENT ON COLUMN payments.paypal_order_id IS 'PayPal order ID for tracking subscription payments';

