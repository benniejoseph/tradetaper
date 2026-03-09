import { ConfigService } from '@nestjs/config';
import { AiQuotaService } from './ai-quota.service';

describe('AiQuotaService', () => {
  let service: AiQuotaService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    service = new AiQuotaService(configService);
  });

  it('returns unlimited quota for premium plan', () => {
    expect(service.getQuotaForPlan('premium')).toBeNull();
  });

  it('normalizes plan string before lookup', () => {
    expect(service.getQuotaForPlan(' Premium ')).toBeNull();
  });

  it('falls back to free quota for unknown plans', () => {
    expect(service.getQuotaForPlan('enterprise')).toBe(0);
  });
});
