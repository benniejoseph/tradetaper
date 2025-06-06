-- Add lastLoginAt column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;
 
-- Create an index on lastLoginAt for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users("lastLoginAt"); 