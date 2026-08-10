import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from './workspace-access.service';

describe('WorkspaceAccessService', () => {
  const userId = '8af8466c-dd8e-409b-99e3-8942e6dac01c';
  let prisma: {
    workspace: {
      findFirst: jest.Mock;
    };
  };
  let service: WorkspaceAccessService;

  beforeEach(() => {
    prisma = {
      workspace: {
        findFirst: jest.fn(),
      },
    };
    service = new WorkspaceAccessService(
      prisma as unknown as PrismaService,
    );
  });

  it('finds a workspace through a normalized member relationship', async () => {
    const workspace = {
      id: '44abc0fd-31a6-4813-b513-f742e4fa0740',
      slug: 'orbit-cloud-lab',
    };
    prisma.workspace.findFirst.mockResolvedValue(workspace);

    await expect(
      service.requireMemberWorkspace(
        '  Orbit-Cloud-Lab  ',
        userId,
      ),
    ).resolves.toEqual(workspace);
    expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
      where: {
        slug: 'orbit-cloud-lab',
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });
  });

  it('uses the same not-found response for a non-member or missing workspace', async () => {
    prisma.workspace.findFirst.mockResolvedValue(null);

    await expect(
      service.requireMemberWorkspace(
        'orbit-cloud-lab',
        userId,
      ),
    ).rejects.toThrow(new NotFoundException('Workspace was not found'));
  });

  it('rejects an invalid workspace slug before querying PostgreSQL', async () => {
    await expect(
      service.requireMemberWorkspace('bad slug!', userId),
    ).rejects.toThrow(
      new BadRequestException(
        'Workspace slug must use lowercase letters, numbers, and hyphens',
      ),
    );
    expect(prisma.workspace.findFirst).not.toHaveBeenCalled();
  });
});
