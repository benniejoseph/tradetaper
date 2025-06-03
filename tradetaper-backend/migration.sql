-- Migration to add plan column to subscriptions table and create usage_tracking table

-- Add plan column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';

-- Handle existing usage_tracking table
-- First, delete any rows with null periodStart values
DELETE FROM usage_tracking WHERE "periodStart" IS NULL;

-- Drop and recreate usage_tracking table to ensure proper schema
DROP TABLE IF EXISTS usage_tracking;

-- Create usage_tracking table with proper constraints
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    trades INTEGER DEFAULT 0,
    accounts INTEGER DEFAULT 0,
    "periodStart" TIMESTAMP NOT NULL,
    "periodEnd" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usage_tracking_user_period_unique UNIQUE ("userId", "periodStart")
);

-- Create index on userId and periodStart for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking ("userId", "periodStart");

-- Update existing subscriptions to have 'free' plan if plan is null
UPDATE subscriptions SET plan = 'free' WHERE plan IS NULL; 