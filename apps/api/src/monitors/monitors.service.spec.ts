import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { MonitorsService } from './monitors.service';

const workspace = {
  id: '44abc0fd-31a6-4813-b513-f742e4fa0740',
  slug: 'orbit-cloud-lab',
};
const userId = '8af8466c-dd8e-409b-99e3-8942e6dac01c';
const createdAt = new Date('2026-08-07T10:00:00.000Z');
const updatedAt = new Date('2026-08-07T10:00:00.000Z');
const monitor = {
  id: 'dbf14e37-89f6-4bed-b266-fb40d8440779',
  workspaceId: workspace.id,
  name: 'Orbit API',
  targetUrl: 'https://api.orbit.test/health',
  interval: 60,
  status: 'PENDING' as const,
  createdAt,
  updatedAt,
};

describe('MonitorsService', () => {
  let prisma: {
    monitor: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let workspaceAccess: {
    requireMemberWorkspace: jest.Mock;
  };
  let service: MonitorsService;

  beforeEach(() => {
    prisma = {
      monitor: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    workspaceAccess = {
      requireMemberWorkspace: jest.fn().mockResolvedValue(workspace),
    };
    service = new MonitorsService(
      prisma as unknown as PrismaService,
      workspaceAccess as unknown as WorkspaceAccessService,
    );
  });

  it('creates a pending monitor for the authorized workspace', async () => {
    prisma.monitor.create.mockResolvedValue(monitor);

    const result = await service.create(
      'orbit-cloud-lab',
      userId,
      {
        name: '  Orbit API  ',
        targetUrl: '  https://api.orbit.test/health  ',
        interval: 60,
      },
    );

    expect(workspaceAccess.requireMemberWorkspace).toHaveBeenCalledWith(
      'orbit-cloud-lab',
      userId,
    );
    expect(prisma.monitor.create).toHaveBeenCalledWith({
      data: {
        name: monitor.name,
        targetUrl: monitor.targetUrl,
        interval: monitor.interval,
        status: 'PENDING',
        workspaceId: workspace.id,
      },
    });
    expect(result).toEqual({
      monitor: {
        ...monitor,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    });
  });

  it('lists only monitors belonging to the authorized workspace', async () => {
    prisma.monitor.findMany.mockResolvedValue([monitor]);

    const result = await service.findForWorkspace(
      workspace.slug,
      userId,
    );

    expect(prisma.monitor.findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(result.monitors[0].status).toBe('PENDING');
  });

  it('does not create a monitor when workspace membership is rejected', async () => {
    workspaceAccess.requireMemberWorkspace.mockRejectedValue(
      new NotFoundException('Workspace was not found'),
    );

    await expect(
      service.create(workspace.slug, userId, {
        name: monitor.name,
        targetUrl: monitor.targetUrl,
        interval: 60,
      }),
    ).rejects.toThrow(new NotFoundException('Workspace was not found'));
    expect(prisma.monitor.create).not.toHaveBeenCalled();
  });

  it('rejects an unsupported interval', async () => {
    await expect(
      service.create(workspace.slug, userId, {
        name: monitor.name,
        targetUrl: monitor.targetUrl,
        interval: 45 as 60,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Monitor interval must be 30, 60, or 300 seconds',
      ),
    );
    expect(prisma.monitor.create).not.toHaveBeenCalled();
  });

  it('rejects a target that is not an HTTP or HTTPS URL', async () => {
    await expect(
      service.create(workspace.slug, userId, {
        name: monitor.name,
        targetUrl: 'ftp://files.orbit.test/status',
        interval: 60,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Monitor target URL must be a valid HTTP or HTTPS URL',
      ),
    );
    expect(prisma.monitor.create).not.toHaveBeenCalled();
  });
});
