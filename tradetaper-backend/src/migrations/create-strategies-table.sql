-- Migration: Create strategies table
-- Description: Add strategies table for trading strategy management

-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    checklist JSONB,
    tradingSession VARCHAR(50),
    isActive BOOLEAN DEFAULT true,
    color VARCHAR(7) DEFAULT '#3B82F6',
    tags TEXT,
    userId UUID NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_strategies_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on userId for better query performance
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(userId);

-- Create index on createdAt for ordering
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(createdAt);

-- Add strategyId column to trades table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'strategyid'
    ) THEN
        ALTER TABLE trades ADD COLUMN strategyId UUID;
        ALTER TABLE trades ADD CONSTRAINT fk_trades_strategy 
            FOREIGN KEY (strategyId) REFERENCES strategies(id) ON DELETE SET NULL;
        
        -- Create index for better query performance
        CREATE INDEX idx_trades_strategy_id ON trades(strategyId);
    END IF;
END $$;