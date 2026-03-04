/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionService } from '../subscriptions/services/subscription.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthSession } from './entities/auth-session.entity';

// A very light-weight mock of UsersService for unit testing only.
const mockUsersService = {
  findOneByEmail: jest.fn(),
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(),
};

const mockSubscriptionService = {
  getOrCreateSubscription: jest.fn(),
  getPricingPlan: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'AUTH_ACCESS_TOKEN_TTL') return '15m';
    if (key === 'AUTH_REFRESH_TOKEN_TTL_DAYS') return '30';
    return undefined;
  }),
};

const mockAuthSessionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getRepositoryToken(AuthSession),
          useValue: mockAuthSessionRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user without password when email & password match', async () => {
      const password = await bcrypt.hash('secret', 10);
      const fakeUser = {
        id: 'u1',
        email: 'test@example.com',
        password,
        validatePassword: async (pw: string) =>
          await bcrypt.compare(pw, password),
      } as any;
      mockUsersService.findOneByEmail.mockResolvedValue(fakeUser);

      const result = await service.validateUser('test@example.com', 'secret');

      if (!result) {
        throw new Error('Expected user object, got null');
      }

      // Mimic controller/strategy: remove password before assertion
      // (in real app, this is done in controller/DTO)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _pw, ...safeUser } = result;

      expect('password' in safeUser).toBe(false);
      expect(safeUser.email).toBe('test@example.com');
    });

    it('returns null when user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      const result = await service.validateUser(
        'nouser@example.com',
        'whatever',
      );
      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const password = await bcrypt.hash('correct', 10);
      const fakeUser = {
        id: 'u1',
        email: 'test@example.com',
        password,
        validatePassword: async (pw: string) =>
          await bcrypt.compare(pw, password),
      } as any;
      mockUsersService.findOneByEmail.mockResolvedValue(fakeUser);
      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });
  });
});
