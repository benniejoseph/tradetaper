import { ConfigService } from '@nestjs/config';
import { TerminalCommandsQueue } from './terminal-commands.queue';

describe('TerminalCommandsQueue', () => {
  const createConfigService = (redisUrl?: string) =>
    ({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'REDIS_URL') {
          return redisUrl;
        }
        return undefined;
      }),
    }) as unknown as ConfigService;

  it('queues and dispatches commands using in-memory fallback', async () => {
    const queue = new TerminalCommandsQueue(createConfigService());
    await queue.onModuleInit();

    await queue.queueCommand('terminal-1', 'FETCH_CANDLES', 'payload-1');
    const statsBefore = await queue.getStats();
    expect(statsBefore.waiting).toBe(1);

    const next = await queue.getNextCommand('terminal-1');
    expect(next).toEqual(
      expect.objectContaining({
        terminalId: 'terminal-1',
        command: 'FETCH_CANDLES',
        payload: 'payload-1',
      }),
    );

    const statsAfter = await queue.getStats();
    expect(statsAfter.waiting).toBe(0);
  });

  it('clears commands for a terminal in in-memory fallback', async () => {
    const queue = new TerminalCommandsQueue(createConfigService());
    await queue.onModuleInit();

    await queue.queueCommand('terminal-1', 'FETCH_CANDLES', 'payload-1');
    await queue.queueCommand('terminal-1', 'SYNC_TRADES', 'payload-2');

    const cleared = await queue.clearTerminalCommands('terminal-1');
    expect(cleared).toBe(2);

    const next = await queue.getNextCommand('terminal-1');
    expect(next).toBeNull();
  });
});
