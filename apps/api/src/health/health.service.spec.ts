import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports readiness only after PostgreSQL answers', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'ok',
      timestamp: expect.any(String),
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not claim readiness when PostgreSQL rejects the probe', async () => {
    const databaseError = new Error('database unavailable');
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(databaseError),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).rejects.toBe(databaseError);
  });
});
