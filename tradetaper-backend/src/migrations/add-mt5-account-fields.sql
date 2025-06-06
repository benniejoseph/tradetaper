-- Migration to add new fields to MT5 accounts table
-- This adds enhanced trading metrics and connection status fields

-- Add new financial metric columns
ALTER TABLE mt5_accounts 
ADD COLUMN IF NOT EXISTS equity DECIMAL(19,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin DECIMAL(19,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_free DECIMAL(19,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit DECIMAL(19,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS leverage INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS connection_status VARCHAR(20) DEFAULT 'DISCONNECTED';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user_id ON mt5_accounts(userId);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_is_active ON mt5_accounts(isActive);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_connection_status ON mt5_accounts(connection_status);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_last_sync ON mt5_accounts(lastSyncAt);

-- Update existing records to have default values for new fields
UPDATE mt5_accounts 
SET 
  equity = balance,
  margin = 0,
  margin_free = balance,
  profit = 0,
  leverage = 100,
  connection_status = 'DISCONNECTED'
WHERE equity IS NULL;

-- Add check constraints for data integrity
ALTER TABLE mt5_accounts 
ADD CONSTRAINT IF NOT EXISTS chk_mt5_balance_non_negative CHECK (balance >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_mt5_equity_non_negative CHECK (equity >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_mt5_margin_non_negative CHECK (margin >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_mt5_margin_free_non_negative CHECK (margin_free >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_mt5_leverage_positive CHECK (leverage > 0),
ADD CONSTRAINT IF NOT EXISTS chk_mt5_connection_status CHECK (
  connection_status IN ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR')
);

-- Comment the table and columns for documentation
COMMENT ON TABLE mt5_accounts IS 'MT5 trading account configurations with enhanced metrics';
COMMENT ON COLUMN mt5_accounts.equity IS 'Current account equity (balance + floating profit/loss)';
COMMENT ON COLUMN mt5_accounts.margin IS 'Used margin for open positions';
COMMENT ON COLUMN mt5_accounts.margin_free IS 'Free margin available for trading';
COMMENT ON COLUMN mt5_accounts.profit IS 'Current floating profit/loss';
COMMENT ON COLUMN mt5_accounts.leverage IS 'Account leverage ratio';
COMMENT ON COLUMN mt5_accounts.connection_status IS 'Current connection status to MT5 terminal';