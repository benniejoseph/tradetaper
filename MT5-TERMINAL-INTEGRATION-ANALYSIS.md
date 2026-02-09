# MT5 Terminal Integration - Deep Dive Analysis

**Date**: February 9, 2026
**Status**: ⚠️ Issues Identified - Action Required

---

## Executive Summary

The MT5 terminal integration has a **functional foundation** but suffers from **critical scalability and reliability issues** that will cause problems under high traffic. The system uses an **in-memory command queue**, lacks proper **connection pooling**, has **no rate limiting on webhook endpoints**, and relies on **simulated terminal provisioning** instead of actual Docker orchestration.

### Risk Level: 🔴 HIGH
- ⚠️ **In-memory state** will be lost on server restart
- ⚠️ **No rate limiting** on webhook endpoints (vulnerable to abuse)
- ⚠️ **Simulated provisioning** (terminals not actually deployed)
- ⚠️ **No connection pooling** for database queries
- ⚠️ **Missing indexes** on critical query paths
- ⚠️ **No retry mechanism** for failed syncs

---

## 1. Architecture Overview

### Current Implementation

```
┌─────────────────┐
│   MT5 Terminal  │
│   (MQL5 EA)     │
└────────┬────────┘
         │ HTTP Webhooks
         │ (Every 60s heartbeat)
         ▼
┌─────────────────────────────────────────┐
│  TradeTaper Backend (NestJS)            │
│  ┌───────────────────────────────────┐  │
│  │ Terminal Webhook Controller        │  │
│  │ - /webhook/terminal/heartbeat     │  │
│  │ - /webhook/terminal/trades        │  │
│  │ - /webhook/terminal/positions     │  │
│  │ - /webhook/terminal/candles       │  │
│  └─────────────┬─────────────────────┘  │
│                │                         │
│  ┌─────────────▼─────────────────────┐  │
│  │ Terminal Farm Service              │  │
│  │ - In-memory command queue ⚠️       │  │
│  │ - Simulated provisioning ⚠️        │  │
│  │ - Trade sync processing            │  │
│  └─────────────┬─────────────────────┘  │
│                │                         │
│  ┌─────────────▼─────────────────────┐  │
│  │ Trades Service                     │  │
│  │ - Duplicate detection              │  │
│  │ - Position-based tracking          │  │
│  │ - Candle storage                   │  │
│  └─────────────┬─────────────────────┘  │
└────────────────┼─────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │   PostgreSQL Database   │
    │   - trades              │
    │   - terminal_instances  │
    │   - mt5_accounts        │
    │   - trade_candles       │
    └─────────────────────────┘
```

---

## 2. Critical Issues & Vulnerabilities

### 🔴 CRITICAL: In-Memory Command Queue

**Location**: `terminal-farm.service.ts:171-183`

```typescript
// In-memory command queue: TerminalID -> Command Object
private commandQueue: Map<string, { command: string; payload: string }[]> =
  new Map();
```

**Problems**:
1. **Data Loss on Restart**: All queued commands are lost if the server restarts
2. **No Persistence**: Commands are not stored in the database
3. **No Horizontal Scaling**: Cannot distribute across multiple server instances
4. **No Retry Logic**: Failed commands are not retried

**Impact**:
- High traffic users will lose candle fetch requests during deployments
- Horizontal scaling is impossible without external queue

**Recommended Fix**:
```typescript
// Use Redis or BullMQ for persistent queue
import { Queue } from 'bullmq';

private commandQueue: Queue;

constructor() {
  this.commandQueue = new Queue('terminal-commands', {
    connection: {
      host: 'redis',
      port: 6379,
    },
  });
}

async queueCommand(terminalId: string, command: string, payload: string) {
  await this.commandQueue.add('execute-command', {
    terminalId,
    command,
    payload,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}
```

---

### 🔴 CRITICAL: No Rate Limiting on Webhook Endpoints

**Location**: `terminal-webhook.controller.ts:24-112`

```typescript
@Controller('webhook/terminal')
export class TerminalWebhookController {
  // NO @UseGuards(RateLimitGuard) or @RateLimit() decorators

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() data: TerminalHeartbeatDto) { ... }

  @Post('trades')
  @HttpCode(HttpStatus.OK)
  async syncTrades(@Body() data: TerminalSyncDto) { ... }
}
```

**Problems**:
1. **No Protection**: Endpoints can be spammed with unlimited requests
2. **API Key Only**: Simple API key validation (`TERMINAL_WEBHOOK_SECRET`) is not enough
3. **DoS Vulnerability**: Malicious actor could overwhelm the system
4. **Database Overload**: Each request triggers database queries

**Impact**:
- 100 concurrent terminals sending heartbeats every 60s = 100 req/min (manageable)
- 1000 terminals = 1000 req/min = 16.6 req/sec (problematic without rate limiting)
- Malicious spam could cause database connection exhaustion

**Recommended Fix**:
```typescript
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('webhook/terminal')
export class TerminalWebhookController {
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 2, // Max 2 heartbeats per minute per terminal
    keyGenerator: (req) => req.body.terminalId,
  })
  async heartbeat(@Body() data: TerminalHeartbeatDto) { ... }

  @Post('trades')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Max 10 trade syncs per minute per terminal
    keyGenerator: (req) => req.body.terminalId,
  })
  async syncTrades(@Body() data: TerminalSyncDto) { ... }
}
```

---

### 🟡 HIGH: Simulated Terminal Provisioning

**Location**: `terminal-farm.service.ts:514-573`

```typescript
private async provisionTerminal(
  terminalId: string,
  account: MT5Account,
  credentials?: EnableAutoSyncDto,
): Promise<void> {
  // ... code ...

  // For now, we'll simulate the process
  const orchestratorUrl = this.configService.get('TERMINAL_ORCHESTRATOR_URL');

  if (orchestratorUrl) {
    // Call orchestrator API (to be implemented)
    // ⚠️ ALL CODE COMMENTED OUT
  }

  // Simulate successful start for dev
  terminal.status = TerminalStatus.RUNNING;
  terminal.containerId = `sim-${Date.now()}`;  // ⚠️ FAKE CONTAINER ID
}
```

**Problems**:
1. **Not Production-Ready**: Terminals are not actually deployed
2. **Manual Intervention Required**: Users must manually run MT5 EAs
3. **No Orchestration**: Docker/Kubernetes integration missing
4. **Fake Status**: System reports "RUNNING" but nothing is running

**Impact**:
- Auto-sync feature doesn't work end-to-end
- Users must manually configure MT5 terminals
- Scalability is blocked until this is implemented

**Status**: 📝 ACKNOWLEDGED - This is a known limitation (FTP-based sync also marked as "coming soon")

---

### 🟡 HIGH: N+1 Query Problem in Trade Sync

**Location**: `terminal-farm.service.ts:255-410`

```typescript
for (const trade of data.trades) {
  // ⚠️ EXECUTED FOR EVERY TRADE IN THE BATCH
  const existingTrade = await this.tradesService.findOneByExternalId(
    terminal.account.userId,
    positionIdString,
  );

  // Another query per trade
  const existing = await this.tradesService.findDuplicate(
    terminal.account.userId,
    trade.symbol,
    new Date(trade.openTime || Date.now()),
    trade.ticket,
  );
}
```

**Problem**:
- Syncing 100 trades = 200+ database queries
- No bulk operations or query batching

**Impact**:
- Slow sync performance for users with many trades
- Database connection pool exhaustion under load

**Recommended Fix**:
```typescript
// Batch fetch all external IDs upfront
const externalIds = data.trades
  .map(t => t.positionId?.toString())
  .filter(Boolean);

const existingTrades = await this.tradesService.findManyByExternalIds(
  terminal.account.userId,
  externalIds,
);

const existingTradesMap = new Map(
  existingTrades.map(t => [t.externalId, t])
);

for (const trade of data.trades) {
  const existing = existingTradesMap.get(trade.positionId?.toString());
  // ... process without additional queries
}
```

---

### 🟡 MEDIUM: Missing Database Indexes

**Current Indexes on `trades` table**:
```typescript
@Index(['user', 'openTime'])
@Index() // on userId column
```

**Missing Critical Indexes**:

1. **externalId lookup** (used in findOneByExternalId):
```sql
-- Currently NO index on externalId
-- Query: WHERE userId = ? AND externalId = ?
```

2. **accountId lookup** (used frequently):
```sql
-- Currently NO index on accountId
-- Query: WHERE accountId = ?
```

3. **Symbol + openTime** (used in findDuplicate):
```sql
-- Currently NO composite index
-- Query: WHERE userId = ? AND symbol = ? AND openTime BETWEEN ? AND ?
```

**Impact**:
- Slow query performance as trade count grows
- Full table scans on large datasets
- Increased database CPU usage

**Recommended Fix**:
```typescript
@Entity('trades')
@Index(['userId', 'externalId']) // For position-based lookup
@Index(['userId', 'accountId']) // For account filtering
@Index(['userId', 'symbol', 'openTime']) // For duplicate detection
@Index(['userId', 'openTime'])
export class Trade { ... }
```

---

### 🟡 MEDIUM: Weak API Key Validation

**Location**: `terminal-webhook.controller.ts:34-37`

```typescript
private validateApiKey(apiKey: string): boolean {
  const expectedKey = this.configService.get('TERMINAL_WEBHOOK_SECRET');
  return !expectedKey || apiKey === expectedKey; // ⚠️ Returns TRUE if not configured
}
```

**Problems**:
1. **Defaults to Open**: If `TERMINAL_WEBHOOK_SECRET` is not set, all requests are accepted
2. **Single Shared Secret**: All terminals use the same API key
3. **No IP Whitelisting**: No additional security layer
4. **No Request Signing**: Simple key comparison (vulnerable to interception)

**Impact**:
- If env variable is missing, webhooks are completely open
- Compromised API key affects ALL terminals

**Recommended Fix**:
```typescript
private validateApiKey(apiKey: string): boolean {
  const expectedKey = this.configService.get('TERMINAL_WEBHOOK_SECRET');

  if (!expectedKey) {
    this.logger.error('TERMINAL_WEBHOOK_SECRET not configured!');
    throw new UnauthorizedException('Webhook authentication not configured');
  }

  return apiKey === expectedKey;
}

// Better: Use per-terminal JWT tokens
private async validateTerminalToken(token: string, terminalId: string): Promise<boolean> {
  try {
    const payload = this.jwtService.verify(token);
    return payload.terminalId === terminalId;
  } catch {
    return false;
  }
}
```

---

### 🟢 LOW: Encryption Key Warning in Development

**Location**: `mt5-accounts.service.ts:47-56`

```typescript
if (
  !this.configService.get<string>('MT5_ENCRYPTION_KEY') &&
  this.configService.get<string>('NODE_ENV') !== 'production'
) {
  this.logger.warn(
    'Using generated encryption keys. Set MT5_ENCRYPTION_KEY and MT5_ENCRYPTION_IV ' +
    'environment variables for production use.',
  );
}
```

**Status**: ✅ ACCEPTABLE - This is intentional for development

---

## 3. Scalability Analysis

### Current Capacity Estimates

| Metric | Current Limit | Bottleneck |
|--------|---------------|------------|
| **Concurrent Terminals** | ~100 | In-memory queue, no rate limiting |
| **Trades per Sync** | ~100 | N+1 query problem |
| **Syncs per Minute** | ~1000 | Database connection pool (default: 10) |
| **Heartbeats per Minute** | Unlimited ⚠️ | No rate limiting |
| **Server Instances** | 1 only ⚠️ | In-memory queue not distributed |

### Scaling Recommendations

1. **Immediate (Required for >100 users)**:
   - Add rate limiting to webhook endpoints
   - Add database indexes for externalId, accountId, symbol
   - Implement query batching in trade sync

2. **Short-term (Required for >500 users)**:
   - Replace in-memory queue with Redis/BullMQ
   - Implement connection pooling optimization
   - Add Redis caching for duplicate checks

3. **Long-term (Required for >1000 users)**:
   - Implement actual terminal orchestration (Docker/K8s)
   - Add horizontal scaling support
   - Implement event streaming (Kafka/RabbitMQ)

---

## 4. Data Sync Reliability

### ✅ GOOD: Position-Based Trade Tracking

The system correctly implements position-based tracking with entry/exit deals:

```typescript
if (trade.positionId) {
  const isEntry = trade.entryType === 0; // DEAL_ENTRY_IN
  const isExit = trade.entryType === 1; // DEAL_ENTRY_OUT

  if (isEntry) {
    // Create new OPEN trade
  } else if (isExit) {
    // Update existing trade to CLOSED
  }
}
```

**Benefits**:
- Correctly handles MT5's deal-based model
- Idempotent sync (duplicate entries are skipped)
- Handles orphan exits gracefully

---

### ✅ GOOD: Automatic Candle Fetching

When a trade closes, the system automatically queues a candle fetch request:

```typescript
// Queue FETCH_CANDLES command for closed trade
const startTime = new Date(entryTime.getTime() - bufferMs);
const endTime = new Date(exitTime.getTime() + bufferMs);
const payload = `${trade.symbol},1m,${startStr},${endStr},${existingTrade.id}`;

this.queueCommand(terminal.id, 'FETCH_CANDLES', payload);
```

**Benefits**:
- Provides trade execution context
- 2-hour buffer before/after for analysis
- Stored in `executionCandles` JSONB column

**Concern**: Commands queued in-memory may be lost (see Critical Issues)

---

### ⚠️ ISSUE: No Sync Retry Mechanism

**Location**: `terminal-farm.service.ts:449-454`

```typescript
} catch (error) {
  this.logger.warn(
    `Failed to import trade ${trade.ticket}: ${error.message}`,
  );
  skipped++;
  // ⚠️ NO RETRY - Trade is permanently skipped
}
```

**Problem**:
- Temporary database errors cause permanent data loss
- No retry queue for failed trades
- No alerting for sync failures

**Recommended Fix**:
```typescript
} catch (error) {
  this.logger.error(
    `Failed to import trade ${trade.ticket}: ${error.message}`,
  );

  // Store failed trade for retry
  await this.failedTradeQueue.add('retry-trade', {
    terminalId: terminal.id,
    trade,
    error: error.message,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });

  skipped++;
}
```

---

## 5. Security Assessment

### ✅ GOOD: Encryption at Rest

MT5 credentials are properly encrypted:

```typescript
private encrypt(text: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    this.encryptionKey,
    this.encryptionIV,
  );
  // ...
}
```

**Benefits**:
- AES-256-CBC encryption
- Separate encryption keys from environment
- Password excluded from default SELECT queries

---

### ✅ GOOD: User Ownership Verification

```typescript
// Verify account ownership before auto-sync
const account = await this.mt5AccountRepository.findOne({
  where: { id: accountId, userId },
});

if (!account) {
  throw new NotFoundException('Account not found');
}
```

**Benefits**:
- Prevents cross-user data access
- Authorization check before terminal provisioning

---

### ⚠️ ISSUE: Webhook Authentication (Already Covered Above)

---

## 6. Code Quality & Maintainability

### ✅ GOOD: Clear Separation of Concerns

- `TerminalFarmService`: Handles terminal lifecycle and command queue
- `TerminalWebhookController`: Receives data from MT5 EAs
- `TradesService`: Manages trade data and business logic
- `MT5AccountsService`: Handles account credentials and encryption

---

### ✅ GOOD: Comprehensive DTOs

All webhook payloads are validated with class-validator:

```typescript
export class TerminalTradeDto {
  @IsString()
  ticket: string;

  @IsOptional()
  @IsNumber()
  positionId?: number;

  @IsOptional()
  @IsNumber()
  entryType?: number; // 0 = IN, 1 = OUT
  // ...
}
```

---

### ⚠️ ISSUE: Commented-Out Code

Multiple sections have commented implementation:

```typescript
// In a full implementation, this would:
// 1. Call Docker API to create a new container
// 2. Pass account credentials as environment variables
// 3. Wait for container to start
// 4. Store container ID

// For now, we'll simulate the process
```

**Recommendation**: Remove commented code or add GitHub issues tracking implementation

---

## 7. Testing & Monitoring

### ❌ MISSING: No Tests Found

No test files found for:
- `terminal-farm.service.spec.ts`
- `terminal-webhook.controller.spec.ts`
- Integration tests for trade sync

**Recommendation**: Add comprehensive tests before production

---

### ⚠️ MONITORING: Basic Logging Only

Current monitoring:
```typescript
this.logger.log(`Trade sync from terminal ${data.terminalId}: ${data.trades.length} trades`);
this.logger.warn(`Unknown terminal: ${data.terminalId}`);
```

**Missing**:
- Metrics collection (Prometheus/Grafana)
- Alerting for sync failures
- Dashboard for terminal health
- Performance tracking

**Recommended Additions**:
```typescript
// Add metrics
private readonly syncDuration = new Histogram({
  name: 'terminal_sync_duration_seconds',
  help: 'Trade sync duration',
});

private readonly syncedTradesTotal = new Counter({
  name: 'terminal_synced_trades_total',
  help: 'Total trades synced',
  labelNames: ['terminal_id', 'status'],
});
```

---

## 8. Recommendations Summary

### 🔴 CRITICAL (Do Immediately)

1. **Add rate limiting** to webhook endpoints
   - Prevents DoS attacks
   - Protects database from overload
   - Estimated effort: 2 hours

2. **Replace in-memory queue** with Redis/BullMQ
   - Enables horizontal scaling
   - Persists commands across restarts
   - Estimated effort: 1 day

3. **Add database indexes** for externalId, accountId, symbol
   - Dramatically improves query performance
   - Essential for > 10k trades per user
   - Estimated effort: 1 hour

### 🟡 HIGH PRIORITY (Do This Week)

4. **Implement query batching** in trade sync
   - Reduces N+1 queries
   - Improves sync speed by 10-20x
   - Estimated effort: 4 hours

5. **Add retry mechanism** for failed trade imports
   - Prevents permanent data loss
   - Handles transient errors
   - Estimated effort: 4 hours

6. **Fix API key validation** to fail closed
   - Secure by default
   - Consider per-terminal JWT tokens
   - Estimated effort: 2 hours

### 🟢 MEDIUM PRIORITY (Do This Month)

7. **Implement actual terminal orchestration**
   - Required for true auto-sync
   - Integrate with Docker/K8s
   - Estimated effort: 1-2 weeks

8. **Add comprehensive monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alerting rules
   - Estimated effort: 3 days

9. **Add integration tests**
   - Test trade sync end-to-end
   - Test webhook authentication
   - Test duplicate detection
   - Estimated effort: 1 week

---

## 9. Performance Benchmarks

### Current Performance (Estimated)

| Operation | Current | Optimized | Improvement |
|-----------|---------|-----------|-------------|
| Sync 100 trades | ~20s | ~2s | 10x faster |
| Heartbeat processing | 50ms | 10ms | 5x faster |
| Duplicate check | 100ms | 5ms | 20x faster |
| Candle fetch queue | In-memory | Redis | Persistent |

---

## 10. Conclusion

The MT5 terminal integration has a **solid architectural foundation** with good separation of concerns, proper encryption, and correct position-based tracking. However, it suffers from **critical scalability issues** that must be addressed before supporting high-traffic users:

### Strengths ✅
- Position-based trade tracking works correctly
- Encryption and security for credentials
- Clean architecture and code organization
- Comprehensive DTO validation

### Critical Weaknesses ⚠️
- In-memory command queue (not production-ready)
- No rate limiting on webhook endpoints
- N+1 query problems
- Missing database indexes
- Simulated terminal provisioning
- No retry mechanism for failed syncs

### Overall Grade: C+ (Functional but not production-ready for scale)

**Next Steps**:
1. Implement critical fixes (rate limiting, indexes, queue persistence)
2. Add comprehensive monitoring and alerting
3. Implement actual terminal orchestration
4. Load test with 100+ concurrent terminals
5. Add retry mechanisms and error handling

---

**Prepared by**: Claude Opus 4.6
**Analysis Date**: February 9, 2026
**Project**: TradeTaper MT5 Integration
