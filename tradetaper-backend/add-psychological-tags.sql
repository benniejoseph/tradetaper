-- Add psychological_tags column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS psychological_tags text;

-- Add chart_image_url column if it doesn't exist
ALTER TABLE trades ADD COLUMN IF NOT EXISTS chart_image_url varchar(2048);
