import { Controller, Get, Logger } from '@nestjs/common';
import { MultiProviderMarketDataService } from './multi-provider.service';

@Controller('market-data')
export class MarketDataPublicController {
  private readonly logger = new Logger(MarketDataPublicController.name);

  constructor(
    private readonly multiProviderService: MultiProviderMarketDataService,
  ) {}

  @Get('providers/status')
  async getProviderStatus() {
    this.logger.log('[MarketDataPublicController] Getting provider status');
    return this.multiProviderService.getProviderStatus();
  }

  @Get('providers/test')
  async testProviders() {
    this.logger.log('[MarketDataPublicController] Testing all providers');
    return this.multiProviderService.testAllProviders();
  }
}
