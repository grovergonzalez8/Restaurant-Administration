import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const health = { check: jest.fn() };
  const database = { pingCheck: jest.fn() };
  const controller = new HealthController(
    health as unknown as HealthCheckService,
    database as unknown as TypeOrmHealthIndicator,
  );

  beforeEach(() => jest.clearAllMocks());

  it('reports the process as alive without external dependencies', () => {
    expect(controller.liveness()).toEqual({ status: 'ok' });
  });

  it('checks PostgreSQL readiness', async () => {
    const result = { status: 'ok', info: { database: { status: 'up' } } };
    database.pingCheck.mockResolvedValue(result.info.database);
    health.check.mockImplementation(async (checks: Array<() => unknown>) => {
      await checks[0]();
      return result;
    });

    await expect(controller.readiness()).resolves.toBe(result);
    expect(database.pingCheck).toHaveBeenCalledWith('database', {
      timeout: 1500,
    });
  });
});
