// src/users/mt5-sync-bootstrap.service.ts
//
// On application startup, re-attaches MetaAPI streaming listeners for all
// accounts that were streaming-active before the last server restart.
// Cloud Run restarts drop all in-memory listeners, so this ensures auto-sync
// (onDealAdded → processMetaApiDeal) resumes automatically without user action.

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { MT5AccountsService } from './mt5-accounts.service';

@Injectable()
export class MT5SyncBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MT5SyncBootstrapService.name);

  constructor(
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    private readonly mt5AccountsService: MT5AccountsService,
  ) {}

  /**
   * Called automatically by NestJS after the app fully bootstraps.
   * Reconnects MetaAPI streaming for all accounts with isStreamingActive=true.
   * Runs in the background — does NOT block HTTP server startup.
   */
  async onApplicationBootstrap(): Promise<void> {
    // Defer 10 seconds to allow DB connection and other services to stabilize
    setTimeout(() => void this.reconnectActiveAccounts(), 10_000);
  }

  private async reconnectActiveAccounts(): Promise<void> {
    this.logger.log('[Bootstrap] Checking for MetaAPI accounts to reconnect...');

    if (!this.mt5AccountsService.isMetaApiEnabled()) {
      this.logger.log('[Bootstrap] MetaAPI is not configured — skipping reconnect.');
      return;
    }

    try {
      const activeAccounts = await this.mt5AccountRepository.find({
        where: { isStreamingActive: true, autoSyncEnabled: true },
        select: ['id', 'metaApiAccountId', 'accountName'],
      });

      if (activeAccounts.length === 0) {
        this.logger.log('[Bootstrap] No streaming-active MetaAPI accounts found.');
        return;
      }

      this.logger.log(
        `[Bootstrap] Reconnecting ${activeAccounts.length} MetaAPI streaming account(s)...`,
      );

      for (const account of activeAccounts) {
        if (!account.metaApiAccountId) continue;

        // Stagger reconnects by 2s each to avoid flooding MetaAPI
        await new Promise((r) => setTimeout(r, 2000));

        try {
          await this.mt5AccountsService.syncMetaApiAccount(account.id, {
            fullHistory: false,
            startStreaming: true,
          });
          this.logger.log(
            `[Bootstrap] Reconnected streaming for account "${account.accountName}" (${account.id})`,
          );
        } catch (err) {
          const msg = err?.message ?? String(err);
          this.logger.warn(
            `[Bootstrap] Failed to reconnect account ${account.id}: ${msg}`,
          );
          // Mark as disconnected so the UI shows the correct status
          await this.mt5AccountRepository.update(account.id, {
            isStreamingActive: false,
            connectionStatus: 'DISCONNECTED',
          });
        }
      }

      this.logger.log('[Bootstrap] MetaAPI streaming reconnect pass complete.');
    } catch (err) {
      this.logger.error(`[Bootstrap] Failed to run reconnect: ${err.message}`, err.stack);
    }
  }
}
