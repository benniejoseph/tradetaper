// src/trades/trades.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { Logger } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { UsageLimitGuard } from '../subscriptions/guards/usage-limit.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('TradesController', () => {
  let controller: TradesController;
  let service: TradesService;

  const mockTrade = {
    id: 'uuid-1',
    symbol: 'EURUSD',
    side: TradeDirection.LONG,
    status: TradeStatus.OPEN,
    openTime: new Date(),
    openPrice: 1.12,
    quantity: 10000,
    commission: 0,
    userId: 'user-uuid-1',
    assetType: AssetType.FOREX,
    strategy: null,
    isGroupLeader: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    getContractSize: jest.fn().mockReturnValue(100000),
    calculatePnl: jest.fn(),
    user: {} as any,
  } as unknown as Trade;

  const mockUser: UserResponseDto = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [TradesController],
      providers: [
        {
          provide: TradesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockTrade),
            findAll: jest.fn().mockResolvedValue({
              data: [mockTrade],
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            }),
            findOne: jest.fn().mockResolvedValue(mockTrade),
            update: jest.fn().mockResolvedValue(mockTrade),
            remove: jest.fn().mockResolvedValue(undefined),
            bulkDelete: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            bulkUpdate: jest
              .fn()
              .mockResolvedValue({ updatedCount: 1, trades: [mockTrade] }),
            bulkImport: jest
              .fn()
              .mockResolvedValue({ importedCount: 1, trades: [mockTrade] }),
            analyzeChart: jest
              .fn()
              .mockResolvedValue({ symbol: 'EURUSD', entryPrice: 1.12 }),
          },
        },
        {
          provide: PerformanceService,
          useValue: {
            getPerformanceMetrics: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(UsageLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<TradesController>(TradesController);
    service = module.get<TradesService>(TradesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a trade', async () => {
      const createTradeDto: CreateTradeDto = {
        symbol: 'EURUSD',
        side: TradeDirection.LONG,
        status: TradeStatus.OPEN,
        openTime: new Date().toISOString(),
        openPrice: 1.12,
        quantity: 10000,
        assetType: AssetType.FOREX,
      };
      const req = { user: mockUser } as any;
      expect(await controller.create(createTradeDto, req)).toEqual(mockTrade);
      expect(service.create).toHaveBeenCalledWith(createTradeDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of trades', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.findAll(req)).toEqual({
        data: [mockTrade],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(mockUser, undefined, undefined, 1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a single trade', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.findOne(mockTrade.id, req)).toEqual(mockTrade);
      expect(service.findOne).toHaveBeenCalledWith(mockTrade.id, mockUser);
    });
  });

  describe('update', () => {
    it('should update a trade', async () => {
      const updateTradeDto: UpdateTradeDto = { notes: 'Updated notes' };
      const req = { user: mockUser } as any;
      expect(
        await controller.update(mockTrade.id, updateTradeDto, req),
      ).toEqual(mockTrade);
      expect(service.update).toHaveBeenCalledWith(
        mockTrade.id,
        updateTradeDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a trade', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.remove(mockTrade.id, req)).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockTrade.id, mockUser);
    });
  });
});
