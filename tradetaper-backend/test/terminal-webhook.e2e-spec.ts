import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TerminalWebhookController } from '../src/terminal-farm/terminal-webhook.controller';
import { TerminalFarmService } from '../src/terminal-farm/terminal-farm.service';
import { TerminalTokenService } from '../src/terminal-farm/terminal-token.service';
import { ConfigService } from '@nestjs/config';

describe('Terminal Webhook (e2e)', () => {
  let app: INestApplication;
  const terminalFarmService = {
    processHeartbeat: jest.fn().mockResolvedValue({ success: true }),
    processTrades: jest
      .fn()
      .mockResolvedValue({ imported: 0, skipped: 0, failed: 0 }),
    processCandles: jest.fn().mockResolvedValue(undefined),
    processPositions: jest.fn().mockResolvedValue(undefined),
  };
  const terminalTokenService = {
    verifyTerminalToken: jest.fn().mockReturnValue(null),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'TERMINAL_WEBHOOK_SECRET') {
        return 'test-terminal-secret';
      }
      return undefined;
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TerminalWebhookController],
      providers: [
        { provide: TerminalFarmService, useValue: terminalFarmService },
        { provide: TerminalTokenService, useValue: terminalTokenService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects heartbeat without API key', async () => {
    await request(app.getHttpServer())
      .post('/webhook/terminal/heartbeat')
      .send({ terminalId: 'test-terminal' })
      .expect(401);
  });

  it('rejects heartbeat with invalid API key', async () => {
    await request(app.getHttpServer())
      .post('/webhook/terminal/heartbeat')
      .set('x-api-key', 'invalid')
      .send({ terminalId: 'test-terminal' })
      .expect(401);
  });

  it('returns validation error for missing body fields', async () => {
    await request(app.getHttpServer())
      .post('/webhook/terminal/trades')
      .set('x-api-key', 'test-terminal-secret')
      .send({})
      .expect(400);
  });
});
