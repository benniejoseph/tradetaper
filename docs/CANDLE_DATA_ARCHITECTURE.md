# Candle Data Architecture - Central Storage Design

## Problem Statement

1. **Cost Optimization**: Avoid redundant API calls to TwelveData (costs money per request)
2. **Performance**: Multiple users requesting same data should hit cache
3. **Data Integrity**: Ensure consistent data across all user sessions

## Current Implementation ✅

### Database Schema
```typescript
@Entity('market_candles')
@Index(['symbol', 'timeframe', 'timestamp'], { unique: true }) // Prevents duplicates
@Index(['symbol', 'timeframe']) // Fast symbol+timeframe queries
export class MarketCandle {
  id: uuid
  symbol: string (indexed)
  timeframe: string ('1m', '5m', '15m', '1h', '4h', '1d')
  timestamp: Date (indexed)
  open: decimal(19,8)
  high: decimal(19,8)
  low: decimal(19,8)
  close: decimal(19,8)
  volume: bigint
  source: string ('twelvedata', 'polygon', 'mt5')
  createdAt: Date
  updatedAt: Date
}
```

### Storage Strategy

**Key Principle**: Central database table shared by ALL users

```
market_candles table
├── XAUUSD_1m_2024-01-01_00:00 → Candle data
├── XAUUSD_1m_2024-01-01_00:01 → Candle data
├── XAUUSD_5m_2024-01-01_00:00 → Candle data
├── EURUSD_1m_2024-01-01_00:00 → Candle data
└── ...
```

**Unique Constraint**: `(symbol, timeframe, timestamp)`
- Prevents duplicate data
- Allows safe upsert operations

## Cache Strategy

### 1. Query Pattern
```typescript
// User requests: XAUUSD, 1m, 2024-01-01 to 2024-01-31
SELECT * FROM market_candles
WHERE symbol = 'XAUUSD'
  AND timeframe = '1m'
  AND timestamp BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY timestamp ASC
```

### 2. Cache Hit Logic
```typescript
expectedCandles = calculateExpectedCandles(timeframe, startDate, endDate)
cachedCandles = queryDatabase(symbol, timeframe, startDate, endDate)

if (cachedCandles.length >= expectedCandles * 0.5) {
  return cachedCandles // CACHE HIT - No API call
} else {
  candles = fetchFromTwelveData() // CACHE MISS - API call
  saveToDatabase(candles) // Store for future users
  return candles
}
```

### 3. Expected Candles Calculation
```typescript
1m:  (endDate - startDate) / 1 minute
5m:  (endDate - startDate) / 5 minutes
15m: (endDate - startDate) / 15 minutes
1h:  (endDate - startDate) / 60 minutes
4h:  (endDate - startDate) / 240 minutes
1d:  (endDate - startDate) / 1440 minutes
```

**Threshold**: 50% coverage triggers API fetch
- Accounts for market closures (weekends, holidays)
- Handles partial data gracefully

## Data Flow Diagram

```
User 1 Requests: XAUUSD, 1m, Jan 2024
        ↓
   Check Database
        ↓
   [Empty] → Fetch TwelveData → Store in DB → Return to User 1
                                      ↓
                              [CACHED IN DATABASE]
                                      ↓
User 2 Requests: XAUUSD, 1m, Jan 2024
        ↓
   Check Database
        ↓
   [FOUND] → Return from DB (NO API CALL) → Return to User 2
```

## API Cost Optimization

### Scenario 1: First User (Cold Cache)
```
Request: XAUUSD, 1m, Jan 1-31 (44,640 candles)
Database: Empty
Action: Fetch from TwelveData
Cost: 1 API credit
```

### Scenario 2: Subsequent Users (Warm Cache)
```
Request: XAUUSD, 1m, Jan 1-31
Database: 44,640 candles cached
Action: Return from database
Cost: 0 API credits ✅
```

### Scenario 3: Partial Cache
```
Request: XAUUSD, 1m, Jan 1-31
Database: 20,000 candles (45% coverage)
Action: Fetch full range from TwelveData (overwrites/updates)
Cost: 1 API credit
```

### Scenario 4: Overlapping Ranges
```
User 1: XAUUSD, 1m, Jan 1-15 → Fetches & caches
User 2: XAUUSD, 1m, Jan 10-31 → Partial hit, fetches full range
Result: Full Jan month now cached
Cost: 2 API credits (but now serves any Jan range for free)
```

## Data Organization

### Symbol Normalization
```typescript
// Stored in database exactly as requested
XAUUSD → XAUUSD (not converted)
EURUSD → EURUSD

// TwelveData API conversion happens at fetch time
XAUUSD → XAU/USD (for API call only)
EURUSD → EUR/USD (for API call only)
```

### Timeframe Storage
```typescript
// Stored exactly as user timeframe
'1m', '5m', '15m', '30m', '1h', '4h', '1d'

// No aggregation stored
// User wants 5m? Store 5m candles (not 1m)
// Aggregation happens client-side if needed
```

### Date Range Indexing
```typescript
// Fast queries using composite index
INDEX (symbol, timeframe, timestamp)

// Query optimization
WHERE symbol = ? AND timeframe = ? AND timestamp BETWEEN ? AND ?
→ Uses index for O(log n) lookup
```

## Storage Limits & Cleanup

### Database Size Management
```typescript
// Automatic cleanup job (runs daily)
DELETE FROM market_candles
WHERE createdAt < NOW() - INTERVAL '90 days'

// Keeps last 90 days of data
// Older data re-fetched if needed (rare)
```

### Expected Database Size
```
1 month of 1m candles (1 symbol): ~44,000 rows
10 symbols × 1 month × 1m: ~440,000 rows
10 symbols × 1 year × 1m: ~5.2M rows

Estimated storage:
- 100 bytes per row
- 5.2M rows = ~520 MB per year
- With indexes: ~1 GB per year (acceptable)
```

## Benefits of This Design

✅ **Cost Efficient**: API calls only on cache miss
✅ **Fast**: Database queries are milliseconds
✅ **Scalable**: Works for any number of users
✅ **Reliable**: Duplicate-safe with unique constraints
✅ **Multi-tenant**: Single storage for all users
✅ **Source Tracking**: Records which API provided data

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| MarketCandle Entity | ✅ Done | Unique indexes, proper types |
| CandleManagementService | ✅ Done | Cache hit logic implemented |
| TwelveData Integration | ✅ Done | Date range support |
| Auto-fetch on miss | ✅ Done | Fetches and stores automatically |
| Cleanup job | ⏳ Optional | Can add scheduled job later |

## Next Steps (Optional Enhancements)

1. **Add Polygon API Fallback**: If TwelveData fails, try Polygon
2. **Prefetch Popular Ranges**: Pre-populate common date ranges
3. **Cache Warming**: Background job to fetch popular symbols
4. **Metrics Dashboard**: Track cache hit rate, API costs
5. **MT5 Integration**: Store candles from MT5 terminal as well

## Summary

✅ **Central storage is already implemented**
✅ **All users share the same cached data**
✅ **No redundant API calls for cached data**
✅ **Unique constraints prevent duplicates**
✅ **Optimized for cost and performance**

The architecture is production-ready and will save money by caching data centrally!
