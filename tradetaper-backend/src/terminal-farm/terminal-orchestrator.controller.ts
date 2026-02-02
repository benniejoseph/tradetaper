import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminalFarmService } from './terminal-farm.service';

/**
 * Controller for the Terminal Orchestrator Script (Python)
 * Allows the external script to fetch active configurations securely.
 */
@Controller('orchestrator')
export class TerminalOrchestratorController {
  constructor(
    private readonly terminalFarmService: TerminalFarmService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate orchestrator secret
   */
  private validateSecret(secret: string): boolean {
    const expectedSecret = this.configService.get('ORCHESTRATOR_SECRET');
    return !expectedSecret || secret === expectedSecret;
  }

  /**
   * Get configuration for all terminals
   * Called by the python orchestrator script to reconcile state
   */
  @Get('config')
  @HttpCode(HttpStatus.OK)
  async getConfig(
    @Headers('x-orchestrator-secret') secret: string,
  ): Promise<any[]> {
    if (!this.validateSecret(secret)) {
      throw new UnauthorizedException('Invalid orchestrator secret');
    }

    return this.terminalFarmService.getOrchestratorConfig();
  }
}
