-- Database initialization script for Docker PostgreSQL
-- This runs when the container starts for the first time

-- Create the main database (already handled by POSTGRES_DB env var)
-- CREATE DATABASE tradetaper_dev;

-- Create any additional databases for testing
CREATE DATABASE tradetaper_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tradetaper_dev TO tradetaper_user;
GRANT ALL PRIVILEGES ON DATABASE tradetaper_test TO tradetaper_user;

-- Set timezone
SET timezone = 'UTC';

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log successful initialization
SELECT 'Database initialization completed successfully' as status; 