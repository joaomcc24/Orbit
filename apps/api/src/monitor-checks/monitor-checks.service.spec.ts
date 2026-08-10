import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import type { CheckExecutionResult } from './check-execution.types';
import { HttpCheckExecutorService } from './http-check-executor.service';
import { MonitorChecksService } from './monitor-checks.service';

const workspace = {
  id: '44abc0fd-31a6-4813-b513-f742e4fa0740',
  slug: 'orbit-cloud-lab',
};
const userId = '8af8466c-dd8e-409b-99e3-8942e6dac01c';
const monitorId = 'dbf14e37-89f6-4bed-b266-fb40d8440779';
const createdAt = new Date('2026-08-10T18:00:00.000Z');
const checkedAt = new Date('2026-08-10T18:01:00.000Z');
const monitor = {
  id: monitorId,
  workspaceId: workspace.id,
  name: 'Orbit API',
  targetUrl: 'https://api.orbit.test/health',
  interval: 60,
  status: 'PENDING' as const,
  lastCheckedAt: null,
  createdAt,
  updatedAt: createdAt,
};
const updatedMonitor = {
  ...monitor,
  status: 'UP' as const,
  lastCheckedAt: checkedAt,
  updatedAt: checkedAt,
};
const execution: CheckExecutionResult = {
  result: 'UP',
  failureReason: null,
  httpStatusCode: 200,
  responseTimeMs: 42,
  checkedAt,
  errorMessage: null,
};
const check = {
  id: 'c581e094-e135-4354-a297-6fb33651546c',
  monitorId,
  targetUrl: monitor.targetUrl,
  ...execution,
};

describe('MonitorChecksService', () => {
  let prisma: {
    monitor: { findFirst: jest.Mock };
    monitorCheck: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let transaction: {
    monitor: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    monitorCheck: { create: jest.Mock };
  };
  let workspaceAccess: { requireMemberWorkspace: jest.Mock };
  let executor: { execute: jest.Mock };
  let service: MonitorChecksService;

  beforeEach(() => {
    transaction = {
      monitor: {
        findFirst: jest.fn().mockResolvedValue(monitor),
        findUnique: jest.fn().mockResolvedValue(updatedMonitor),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      monitorCheck: {
        create: jest.fn().mockResolvedValue(check),
      },
    };
    prisma = {
      monitor: {
        findFirst: jest.fn().mockResolvedValue(monitor),
      },
      monitorCheck: {
        findMany: jest.fn().mockResolvedValue([check]),
      },
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    workspaceAccess = {
      requireMemberWorkspace: jest.fn().mockResolvedValue(workspace),
    };
    executor = {
      execute: jest.fn().mockResolvedValue(execution),
    };
    service = new MonitorChecksService(
      prisma as unknown as PrismaService,
      workspaceAccess as unknown as WorkspaceAccessService,
      executor as unknown as HttpCheckExecutorService,
    );
  });

  it('executes and transactionally persists a check for a workspace monitor', async () => {
    const result = await service.run(workspace.slug, monitorId, userId);

    expect(workspaceAccess.requireMemberWorkspace).toHaveBeenCalledWith(
      workspace.slug,
      userId,
    );
    expect(prisma.monitor.findFirst).toHaveBeenCalledWith({
      where: { id: monitorId, workspaceId: workspace.id },
    });
    expect(executor.execute).toHaveBeenCalledWith(monitor.targetUrl);
    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: {
        monitorId,
        targetUrl: monitor.targetUrl,
        ...execution,
      },
    });
    expect(transaction.monitor.updateMany).toHaveBeenCalledWith({
      where: {
        id: monitorId,
        workspaceId: workspace.id,
        targetUrl: monitor.targetUrl,
        OR: [
          { lastCheckedAt: null },
          { lastCheckedAt: { lt: checkedAt } },
        ],
      },
      data: {
        status: 'UP',
        lastCheckedAt: checkedAt,
      },
    });
    expect(result).toEqual({
      monitor: {
        ...updatedMonitor,
        lastCheckedAt: checkedAt.toISOString(),
        createdAt: createdAt.toISOString(),
        updatedAt: checkedAt.toISOString(),
      },
      check: {
        ...check,
        checkedAt: checkedAt.toISOString(),
      },
    });
  });

  it('does not execute a monitor outside the authorized workspace', async () => {
    prisma.monitor.findFirst.mockResolvedValue(null);

    await expect(
      service.run(workspace.slug, monitorId, userId),
    ).rejects.toThrow(new NotFoundException('Monitor was not found'));
    expect(executor.execute).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a malformed monitor identifier before querying PostgreSQL', async () => {
    await expect(
      service.run(workspace.slug, 'not-a-uuid', userId),
    ).rejects.toThrow(new NotFoundException('Monitor was not found'));
    expect(prisma.monitor.findFirst).not.toHaveBeenCalled();
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('lists the latest checks with a bounded caller-selected limit', async () => {
    const result = await service.list(workspace.slug, monitorId, userId, '5');

    expect(prisma.monitorCheck.findMany).toHaveBeenCalledWith({
      where: { monitorId },
      orderBy: [{ checkedAt: 'desc' }, { id: 'desc' }],
      take: 5,
    });
    expect(result.checks[0]).toEqual({
      ...check,
      checkedAt: checkedAt.toISOString(),
    });
  });

  it.each(['0', '101', 'five', '1.5'])('rejects invalid history limit %s', async (limit) => {
    await expect(
      service.list(workspace.slug, monitorId, userId, limit),
    ).rejects.toThrow(
      new BadRequestException('limit must be an integer from 1 to 100'),
    );
    expect(prisma.monitorCheck.findMany).not.toHaveBeenCalled();
  });
});
