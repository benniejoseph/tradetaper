// src/terminal-farm/terminal-webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminalFarmService } from './terminal-farm.service';
import { TerminalTokenService } from './terminal-token.service';
import {
  TerminalHeartbeatDto,
  TerminalSyncDto,
  TerminalPositionsDto,
  TerminalCandlesSyncDto,
} from './dto/terminal.dto';
import { RateLimit } from '../common/guards/rate-limit.guard';

/**
 * Webhook controller for receiving data from Terminal Farm EA
 * These endpoints are called by the MQL5 Expert Advisor running in each terminal
 *
 * SECURITY:
 * - All endpoints require API key authentication via x-api-key header
 * - Rate limiting applied per terminal to prevent abuse
 * - Webhooks fail closed if TERMINAL_WEBHOOK_SECRET not configured
 */
@Controller('webhook/terminal')
export class TerminalWebhookController {
  private readonly logger = new Logger(TerminalWebhookController.name);

  constructor(
    private readonly terminalFarmService: TerminalFarmService,
    private readonly configService: ConfigService,
    private readonly terminalTokenService: TerminalTokenService,
  ) {}

  /**
   * Validate API key from terminal EA
   * SECURITY: Fails closed if TERMINAL_WEBHOOK_SECRET not configured
   */
  private validateAuth(
    apiKey: string,
    authToken: string | undefined,
    terminalId: string,
  ): boolean {
    if (authToken) {
      const payload = this.terminalTokenService.verifyTerminalToken(authToken);
      if (!payload || payload.terminalId !== terminalId) {
        this.logger.warn('Invalid terminal auth token provided');
        return false;
      }
      return true;
    }

    const expectedKey = this.configService.get('TERMINAL_WEBHOOK_SECRET');
    if (!expectedKey) {
      this.logger.error(
        'TERMINAL_WEBHOOK_SECRET not configured! Rejecting webhook request.',
      );
      throw new UnauthorizedException(
        'Webhook authentication not configured. Contact administrator.',
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      this.logger.warn('Invalid API key provided for webhook request');
      return false;
    }

    return true;
  }

  /**
   * Receive heartbeat from terminal EA
   * Called every 60 seconds to indicate terminal is alive
   *
   * RATE LIMIT: 2 requests per minute per terminal
   * (Heartbeat expected every 60s, allow 2 for clock drift)
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 2, // Max 2 heartbeats per minute per terminal
    keyGenerator: (req) => `terminal:${req.body.terminalId || 'unknown'}`,
    message: 'Heartbeat rate limit exceeded. Maximum 2 per minute.',
  })
  async heartbeat(
    @Body() data: TerminalHeartbeatDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    if (!this.validateAuth(apiKey, data.authToken, data.terminalId)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.terminalFarmService.processHeartbeat(data);
  }

  /**
   * Receive trade candles sync from terminal EA
   *
   * RATE LIMIT: 20 requests per minute per terminal
   * (Multiple candle requests expected for closed trades)
   */
  @Post('candles')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Max 20 candle syncs per minute per terminal
    keyGenerator: (req) => `terminal:${req.body.terminalId || 'unknown'}`,
    message: 'Candle sync rate limit exceeded. Maximum 20 per minute.',
  })
  async syncCandles(
    @Body() data: TerminalCandlesSyncDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    if (!this.validateAuth(apiKey, data.authToken, data.terminalId)) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.terminalFarmService.processCandles(data);
    return { success: true };
  }

  /**
   * Receive trade history sync from terminal EA
   * Called when new trades are detected or on initial sync
   *
   * RATE LIMIT: 10 requests per minute per terminal
   * (Trade syncs expected on new trades or manual sync)
   */
  @Post('trades')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Max 10 trade syncs per minute per terminal
    keyGenerator: (req) => `terminal:${req.body.terminalId || 'unknown'}`,
    message: 'Trade sync rate limit exceeded. Maximum 10 per minute.',
  })
  async syncTrades(
    @Body() data: TerminalSyncDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean; imported: number; skipped: number; failed: number }> {
    if (!this.validateAuth(apiKey, data.authToken, data.terminalId)) {
      throw new UnauthorizedException('Invalid API key');
    }

    const result = await this.terminalFarmService.processTrades(data);
    return {
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
    };
  }

  /**
   * Receive live positions update from terminal EA
   * Called whenever positions change
   *
   * RATE LIMIT: 30 requests per minute per terminal
   * (Position updates expected frequently on volatile markets)
   */
  @Post('positions')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // Max 30 position updates per minute per terminal
    keyGenerator: (req) => `terminal:${req.body.terminalId || 'unknown'}`,
    message: 'Position update rate limit exceeded. Maximum 30 per minute.',
  })
  async updatePositions(
    @Body() data: TerminalPositionsDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    if (!this.validateAuth(apiKey, data.authToken, data.terminalId)) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.terminalFarmService.processPositions(data);
    return { success: true };
  }
}
