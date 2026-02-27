import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MT5Account } from './entities/mt5-account.entity';
import { MetaApiService } from './metaapi.service';
import { ConfigService } from '@nestjs/config';

/**
 * MetaApiIdleSuspensionService
 *
 * Cost-saving mechanism: MetaAPI charges ~$8/account/month per deployed account.
 * Accounts with no heartbeat/activity in the last 30 days are "idle" — we undeploy
 * them from MetaAPI to stop billing while preserving all trade data in the DB.
 *
 * When a user logs in or manually initiates sync, their account is re-deployed
 * (takes ~15–30s). See MT5AccountsService.syncMetaApiAccount() for re-deploy logic.
 */
@Injectable()
export class MetaApiIdleSuspensionService {
  private readonly logger = new Logger(MetaApiIdleSuspensionService.name);

  /** Number of days of inactivity before suspension */
  private readonly IDLE_DAYS = 30;

  constructor(
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepository: Repository<MT5Account>,
    private readonly metaApiService: MetaApiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Runs once daily at 2:00 AM to suspend idle MetaAPI accounts.
   * Only runs when MetaAPI is enabled.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async suspendIdleAccounts(): Promise<void> {
    if (!this.metaApiService.isEnabled()) {
      this.logger.debug('MetaAPI disabled — skipping idle suspension scan');
      return;
    }

    const idleThreshold = new Date();
    idleThreshold.setDate(idleThreshold.getDate() - this.IDLE_DAYS);

    // Find accounts that:
    // - Have a MetaAPI account ID (i.e., deployed/tracked)
    // - Have NOT had a heartbeat in the last 30 days (or never had one)
    // - Are not already suspended
    const idleAccounts = await this.mt5AccountRepository.find({
      where: [
        {
          metaApiAccountId: Not(IsNull()),
          connectionStatus: Not('SUSPENDED'),
          lastHeartbeatAt: LessThan(idleThreshold),
        },
        {
          metaApiAccountId: Not(IsNull()),
          connectionStatus: Not('SUSPENDED'),
          lastHeartbeatAt: IsNull(), // never connected — also idle if account is old
        },
      ],
      select: ['id', 'metaApiAccountId', 'userId', 'accountName', 'createdAt', 'lastHeartbeatAt'],
    });

    if (idleAccounts.length === 0) {
      this.logger.debug('No idle MetaAPI accounts to suspend.');
      return;
    }

    this.logger.log(`Found ${idleAccounts.length} idle MetaAPI account(s) — suspending to reduce costs`);

    let suspended = 0;
    let failed = 0;

    for (const account of idleAccounts) {
      // Skip accounts created within the last 30 days (grace period)
      const accountAge = Date.now() - account.createdAt.getTime();
      const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);
      if (accountAgeDays < this.IDLE_DAYS) {
        this.logger.debug(`Account ${account.id} is within grace period (${Math.floor(accountAgeDays)} days old), skipping`);
        continue;
      }

      try {
        await this.undeployAndMarkSuspended(account);
        suspended++;
      } catch (err) {
        this.logger.error(
          `Failed to suspend idle MetaAPI account ${account.id} (${account.metaApiAccountId}): ${err.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Idle MetaAPI suspension run complete: ${suspended} suspended, ${failed} failed`,
    );
  }

  /**
   * Undeploy the MetaAPI account and mark it as SUSPENDED in the DB.
   * The account is NOT deleted from MetaAPI — data is preserved.
   * Re-activated via MT5AccountsService.syncMetaApiAccount() when user logs in.
   */
  private async undeployAndMarkSuspended(account: MT5Account): Promise<void> {
    const { metaApiAccountId } = account;
    if (!metaApiAccountId) return;

    try {
      const api = this.metaApiService.getMetaApiInstance();
      if (api) {
        const metaAccount = await api.metatraderAccountApi.getAccount(metaApiAccountId);

        // Only undeploy if currently deployed (avoid API errors on already-undeployed accounts)
        if (metaAccount.state !== 'UNDEPLOYED') {
          this.logger.log(
            `Undeploying idle MetaAPI account: ${account.accountName} (${metaApiAccountId}) — last heartbeat: ${account.lastHeartbeatAt?.toISOString() ?? 'never'}`,
          );
          await metaAccount.undeploy();
        }
      }
    } catch (err) {
      // If the MetaAPI account doesn't exist remotely, proceed to update DB anyway
      this.logger.warn(
        `Could not undeploy MetaAPI account ${metaApiAccountId}: ${err.message}. Marking as suspended in DB.`,
      );
    }

    // Mark as SUSPENDED in the database
    await this.mt5AccountRepository.update(account.id, {
      connectionStatus: 'SUSPENDED',
      connectionState: 'UNDEPLOYED',
      isStreamingActive: false,
      deploymentState: 'UNDEPLOYED',
    });

    this.logger.log(`Account ${account.accountName} (${account.id}) marked as SUSPENDED`);
  }

  /**
   * Manually trigger suspension for a specific account.
   * Useful for admin operations or when a user downgrade removes MT5 access.
   */
  async suspendAccount(accountId: string): Promise<void> {
    const account = await this.mt5AccountRepository.findOne({
      where: { id: accountId },
      select: ['id', 'metaApiAccountId', 'userId', 'accountName', 'createdAt', 'lastHeartbeatAt'],
    });
    if (!account) {
      this.logger.warn(`Cannot suspend — account ${accountId} not found`);
      return;
    }
    await this.undeployAndMarkSuspended(account);
  }
}
