import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const createContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => class TestClass {},
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    jwtService = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'ADMIN_JWT_SECRET':
            return 'admin-secret';
          case 'ADMIN_REQUIRE_MFA':
            return undefined;
          case 'ADMIN_MFA_TOTP_SECRET':
            return undefined;
          default:
            return undefined;
        }
      }),
    } as unknown as jest.Mocked<ConfigService>;

    guard = new AdminGuard(reflector, jwtService, configService);
  });

  it('allows public endpoints without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
  });

  it('accepts cookie token when bearer token is missing', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'admin:admin@tradetaper.com',
      email: 'admin@tradetaper.com',
      role: 'admin',
      mfa: true,
    } as never);

    const request: Record<string, unknown> = {
      headers: {},
      cookies: {
        admin_token: 'cookie-token',
      },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('cookie-token', {
      secret: 'admin-secret',
    });
    expect(request.user).toEqual({
      id: 'admin:admin@tradetaper.com',
      email: 'admin@tradetaper.com',
      role: 'admin',
      mfa: true,
    });
  });

  it('rejects token when MFA is required but claim is missing', async () => {
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'ADMIN_JWT_SECRET':
          return 'admin-secret';
        case 'ADMIN_REQUIRE_MFA':
          return 'true';
        case 'ADMIN_MFA_TOTP_SECRET':
          return 'JBSWY3DPEHPK3PXP';
        default:
          return undefined;
      }
    });
    jwtService.verify.mockReturnValue({
      sub: 'admin:admin@tradetaper.com',
      email: 'admin@tradetaper.com',
      role: 'admin',
      mfa: false,
    } as never);

    await expect(
      guard.canActivate(
        createContext({
          headers: { authorization: 'Bearer token' },
          cookies: {},
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
