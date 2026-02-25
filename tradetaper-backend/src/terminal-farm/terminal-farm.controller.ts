// src/terminal-farm/terminal-farm.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TerminalFarmService } from './terminal-farm.service';
import {
  TerminalResponseDto,
  EnableAutoSyncDto,
  TerminalLivePositionsResponseDto,
} from './dto/terminal.dto';

/**
 * Controller for user-facing terminal management operations
 */
@Controller('mt5-accounts')
@UseGuards(JwtAuthGuard)
export class TerminalFarmController {
  constructor(private readonly terminalFarmService: TerminalFarmService) {}

  /**
   * Enable auto-sync (provision terminal) for an account
   */
  @Post(':accountId/enable-autosync')
  async enableAutoSync(
    @Param('accountId') accountId: string,
    @Body() dto: EnableAutoSyncDto,
    @Request() req,
  ): Promise<TerminalResponseDto> {
    return this.terminalFarmService.enableAutoSync(accountId, req.user.id, dto);
  }

  /**
   * Disable auto-sync (teardown terminal) for an account
   */
  @Delete(':accountId/disable-autosync')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableAutoSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ): Promise<void> {
    await this.terminalFarmService.disableAutoSync(accountId, req.user.id);
  }

  /**
   * Get terminal status for an account
   */
  @Get(':accountId/terminal-status')
  async getTerminalStatus(
    @Param('accountId') accountId: string,
    @Request() req,
  ): Promise<TerminalResponseDto | { enabled: false }> {
    const status = await this.terminalFarmService.getTerminalStatus(
      accountId,
      req.user.id,
    );
    return status || { enabled: false };
  }

  /**
   * Get per-terminal auth token (JWT) for webhook authentication
   */
  @Get(':accountId/terminal-token')
  async getTerminalToken(
    @Param('accountId') accountId: string,
    @Request() req,
  ): Promise<{ token: string }> {
    return this.terminalFarmService.getTerminalAuthToken(
      accountId,
      req.user.id,
    );
  }

  /**
   * Request a manual trade sync from the terminal
   */
  @Post(':accountId/sync')
  @HttpCode(HttpStatus.OK)
  async requestSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ): Promise<{ queued: boolean; message: string }> {
    return this.terminalFarmService.requestManualSync(accountId, req.user.id);
  }

  /**
   * Get live positions for an account (from terminal metadata)
   */
  @Get(':accountId/live-positions')
  async getLivePositions(
    @Param('accountId') accountId: string,
    @Request() req,
  ): Promise<TerminalLivePositionsResponseDto> {
    return this.terminalFarmService.getLivePositions(accountId, req.user.id);
  }
}
