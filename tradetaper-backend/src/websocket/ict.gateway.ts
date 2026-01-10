import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { KillZoneService } from '../market-intelligence/ict/kill-zone.service';
import { PremiumDiscountService } from '../market-intelligence/ict/premium-discount.service';
import { PowerOfThreeService } from '../market-intelligence/ict/power-of-three.service';
import { MarketDataProviderService } from '../market-intelligence/ict/market-data-provider.service';

interface ICTSubscription {
  symbol: string;
  socketId: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      /^https:\/\/tradetaper-frontend.*\.vercel\.app$/,
    ],
    credentials: true,
  },
  namespace: '/ict',
})
export class ICTGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ICTGateway');
  private subscriptions = new Map<string, ICTSubscription>();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly killZoneService: KillZoneService,
    private readonly premiumDiscountService: PremiumDiscountService,
    private readonly powerOfThreeService: PowerOfThreeService,
    private readonly marketDataProvider: MarketDataProviderService,
  ) {}

  afterInit() {
    this.logger.log('🎯 ICT WebSocket Gateway initialized');
    
    // Start periodic updates every 30 seconds
    this.updateInterval = setInterval(() => {
      this.broadcastUpdates();
    }, 30000);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`✅ ICT client connected: ${client.id}`);
    client.emit('ict:connected', { 
      message: 'Connected to ICT real-time feed',
      socketId: client.id 
    });
  }

  async handleDisconnect(client: Socket) {
    this.subscriptions.delete(client.id);
    this.logger.log(`🔌 ICT client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ict:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    const { symbol } = data;
    this.subscriptions.set(client.id, { symbol, socketId: client.id });
    this.logger.log(`📊 Client ${client.id} subscribed to ${symbol}`);
    
    // Send immediate data
    await this.sendICTData(client, symbol);
    
    return { event: 'ict:subscribed', symbol };
  }

  @SubscribeMessage('ict:unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.subscriptions.delete(client.id);
    this.logger.log(`📊 Client ${client.id} unsubscribed`);
    return { event: 'ict:unsubscribed' };
  }

  private async sendICTData(client: Socket, symbol: string) {
    try {
      // Send Kill Zones data
      const killZonesData = this.killZoneService.analyzeKillZones();
      client.emit('ict:killzones', killZonesData);

      // Get price data for analysis
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe: '1H',
        limit: 100,
      });

      // Send Premium/Discount data
      const premiumDiscountData = this.premiumDiscountService.analyzePremiumDiscount(symbol, priceData, '1H');
      client.emit('ict:premium-discount', premiumDiscountData);

      // Send Power of Three data
      const powerOfThreeData = this.powerOfThreeService.analyzePowerOfThree(symbol, priceData, '1H');
      client.emit('ict:power-of-three', powerOfThreeData);

    } catch (error) {
      this.logger.error(`Error sending ICT data: ${error.message}`);
      client.emit('ict:error', { message: error.message });
    }
  }

  private async broadcastUpdates() {
    const uniqueSymbols = new Set(
      Array.from(this.subscriptions.values()).map(s => s.symbol)
    );

    for (const symbol of uniqueSymbols) {
      try {
        // Get data for this symbol
        const killZonesData = this.killZoneService.analyzeKillZones();
        const priceData = await this.marketDataProvider.getPriceData({
          symbol,
          timeframe: '1H',
          limit: 100,
        });
        const premiumDiscountData = this.premiumDiscountService.analyzePremiumDiscount(symbol, priceData, '1H');
        const powerOfThreeData = this.powerOfThreeService.analyzePowerOfThree(symbol, priceData, '1H');

        // Broadcast to all subscribed clients
        for (const [socketId, sub] of this.subscriptions) {
          if (sub.symbol === symbol) {
            const client = this.server.sockets.sockets.get(socketId);
            if (client) {
              client.emit('ict:killzones', killZonesData);
              client.emit('ict:premium-discount', premiumDiscountData);
              client.emit('ict:power-of-three', powerOfThreeData);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error broadcasting updates for ${symbol}: ${error.message}`);
      }
    }
  }
}
