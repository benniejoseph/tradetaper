// src/trades/trades.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';
import { Express } from 'express'; // Import Express for Multer File type
import { GeminiVisionService } from '../notes/gemini-vision.service'; // New import
import { Logger } from '@nestjs/common'; // New import

describe('TradesController', () => {
  let controller: TradesController;
  let service: TradesService;

  const mockTrade: Trade = {
    id: 'uuid-1',
    symbol: 'EURUSD',
    side: TradeDirection.LONG,
    status: TradeStatus.OPEN,
    openTime: new Date(),
    openPrice: 1.1200,
    quantity: 10000,
    commission: 0,
    userId: 'user-uuid-1',
    assetType: AssetType.FOREX,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    calculatePnl: jest.fn(),
    user: {} as any, // Added user property
  };

  const mockUser: UserResponseDto = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradesController],
      providers: [
        {
          provide: TradesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockTrade),
            findAll: jest.fn().mockResolvedValue([mockTrade]),
            findOne: jest.fn().mockResolvedValue(mockTrade),
            update: jest.fn().mockResolvedValue(mockTrade),
            remove: jest.fn().mockResolvedValue(undefined),
            bulkDelete: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            bulkUpdate: jest.fn().mockResolvedValue({ updatedCount: 1, trades: [mockTrade] }),
            bulkImport: jest.fn().mockResolvedValue({ importedCount: 1, trades: [mockTrade] }),
            analyzeChart: jest.fn().mockResolvedValue({ symbol: 'EURUSD', entryPrice: 1.1200 }),
          },
        },
        {
          provide: GeminiVisionService,
          useValue: {
            analyzeChartImage: jest.fn().mockResolvedValue({ symbol: 'EURUSD', entryPrice: 1.1200 }),
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
    }).compile();

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
        openPrice: 1.1200,
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
      expect(await controller.findAll(req)).toEqual([mockTrade]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, undefined);
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
      expect(await controller.update(mockTrade.id, updateTradeDto, req)).toEqual(mockTrade);
      expect(service.update).toHaveBeenCalledWith(mockTrade.id, updateTradeDto, mockUser);
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
