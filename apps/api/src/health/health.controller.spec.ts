import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthService: {
    check: jest.Mock;
  };
  let controller: HealthController;

  beforeEach(() => {
    healthService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        database: 'ok',
        timestamp: '2026-08-11T16:00:00.000Z',
      }),
    };
    controller = new HealthController(
      healthService as unknown as HealthService,
    );
  });

  it('uses the database check for both readiness routes', async () => {
    await expect(controller.readiness()).resolves.toMatchObject({
      status: 'ok',
      database: 'ok',
    });
    await expect(controller.ready()).resolves.toMatchObject({
      status: 'ok',
      database: 'ok',
    });
    expect(healthService.check).toHaveBeenCalledTimes(2);
  });

  it('reports liveness without querying a dependency', () => {
    expect(controller.live()).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
    });
    expect(controller.ping()).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
    });
    expect(healthService.check).not.toHaveBeenCalled();
  });
});
