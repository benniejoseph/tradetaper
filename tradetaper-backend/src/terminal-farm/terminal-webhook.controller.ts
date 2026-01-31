// src/terminal-farm/terminal-webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminalFarmService } from './terminal-farm.service';
import {
  TerminalHeartbeatDto,
  TerminalSyncDto,
  TerminalPositionsDto,
  TerminalCandlesSyncDto,
} from './dto/terminal.dto';

/**
 * Webhook controller for receiving data from Terminal Farm EA
 * These endpoints are called by the MQL5 Expert Advisor running in each terminal
 */
@Controller('webhook/terminal')
export class TerminalWebhookController {
  constructor(
    private readonly terminalFarmService: TerminalFarmService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate API key from terminal EA
   */
  private validateApiKey(apiKey: string): boolean {
    const expectedKey = this.configService.get('TERMINAL_WEBHOOK_SECRET');
    return !expectedKey || apiKey === expectedKey;
  }

  /**
   * Receive heartbeat from terminal EA
   * Called every 60 seconds to indicate terminal is alive
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(
    @Body() data: TerminalHeartbeatDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    if (!this.validateApiKey(apiKey)) {
      return { success: false };
    }

    return this.terminalFarmService.processHeartbeat(data);
  }

  /**
   * Receive trade candles sync from terminal EA
   */
  @Post('candles')
  @HttpCode(HttpStatus.OK)
  async syncCandles(
    @Body() data: TerminalCandlesSyncDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    if (!this.validateApiKey(apiKey)) {
      return { success: false };
    }

    await this.terminalFarmService.processCandles(data);
    return { success: true };
  }

  /**
   * Receive trade history sync from terminal EA
   * Called when new trades are detected or on initial sync
   */
  @Post('trades')
  @HttpCode(HttpStatus.OK)
  async syncTrades(
    @Body() data: TerminalSyncDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean; imported: number; skipped: number }> {
    if (!this.validateApiKey(apiKey)) {
      return { success: false, imported: 0, skipped: 0 };
    }

    const result = await this.terminalFarmService.processTrades(data);
    return { 
      success: true, 
      imported: result.imported, 
      skipped: result.skipped 
    };
  }

  /**
   * Receive live positions update from terminal EA
   * Called whenever positions change
   */
  @Post('positions')
  @HttpCode(HttpStatus.OK)
  async updatePositions(
    @Body() data: TerminalPositionsDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    if (!this.validateApiKey(apiKey)) {
      return { success: false };
    }

    await this.terminalFarmService.processPositions(data);
    return { success: true };
  }
}
