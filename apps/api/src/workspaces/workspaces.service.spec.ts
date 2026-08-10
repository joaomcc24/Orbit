import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspacesService } from './workspaces.service';

const userId = '8af8466c-dd8e-409b-99e3-8942e6dac01c';
const createInput = {
  name: 'Orbit Cloud Lab',
  slug: 'orbit-cloud-lab',
};
const createdAt = new Date('2026-07-13T10:00:00.000Z');
const updatedAt = new Date('2026-07-13T10:05:00.000Z');
const owner = {
  id: userId,
  email: 'joao@example.com',
  name: 'Joao Cardoso',
  passwordHash: 'stored-password-hash',
  createdAt,
  updatedAt,
};
const workspace = {
  id: '44abc0fd-31a6-4813-b513-f742e4fa0740',
  name: createInput.name,
  slug: createInput.slug,
  createdAt,
  updatedAt,
  members: [
    {
      id: 'b8a17673-b913-4b0d-85e2-c2f85e532c0a',
      role: 'OWNER' as const,
      createdAt,
      userId,
      workspaceId: '44abc0fd-31a6-4813-b513-f742e4fa0740',
      user: owner,
    },
  ],
};

describe('WorkspacesService', () => {
  let prisma: {
    workspace: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let workspaceAccess: {
    requireMemberWorkspace: jest.Mock;
  };
  let service: WorkspacesService;

  beforeEach(() => {
    prisma = {
      workspace: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    workspaceAccess = {
      requireMemberWorkspace: jest.fn(),
    };
    service = new WorkspacesService(
      prisma as unknown as PrismaService,
      workspaceAccess as unknown as WorkspaceAccessService,
    );
  });

  it('creates a workspace owned by the authenticated user', async () => {
    prisma.workspace.create.mockResolvedValue(workspace);

    const result = await service.create(userId, {
      name: '  Orbit Cloud Lab  ',
      slug: '  Orbit-Cloud-Lab  ',
    });

    expect(prisma.workspace.create).toHaveBeenCalledWith({
      data: {
        name: createInput.name,
        slug: createInput.slug,
        members: {
          create: {
            role: 'OWNER',
            userId,
          },
        },
      },
      include: expect.any(Object),
    });
    expect(result.workspace).toMatchObject({
      slug: createInput.slug,
      members: [
        {
          role: 'OWNER',
          user: {
            id: userId,
            email: owner.email,
          },
        },
      ],
    });
  });

  it('rejects a request with missing fields', async () => {
    await expect(service.create(userId, undefined)).rejects.toThrow(
      new BadRequestException('name and slug are required'),
    );
    expect(prisma.workspace.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid workspace slug', async () => {
    await expect(
      service.create(userId, { ...createInput, slug: 'bad slug!' }),
    ).rejects.toThrow(
      new BadRequestException(
        'Workspace slug must use lowercase letters, numbers, and hyphens',
      ),
    );
  });

  it('translates a duplicate slug into a conflict', async () => {
    prisma.workspace.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['slug'] },
    });

    await expect(service.create(userId, createInput)).rejects.toThrow(
      new ConflictException('Workspace slug is already in use'),
    );
  });

  it('finds workspace details after user membership is authorized', async () => {
    workspaceAccess.requireMemberWorkspace.mockResolvedValue({
      id: workspace.id,
      slug: workspace.slug,
    });
    prisma.workspace.findUnique.mockResolvedValue(workspace);

    const result = await service.findBySlug(workspace.slug, userId);

    expect(workspaceAccess.requireMemberWorkspace).toHaveBeenCalledWith(
      workspace.slug,
      userId,
    );
    expect(prisma.workspace.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: workspace.id } }),
    );
    expect(result.workspace.slug).toBe(workspace.slug);
  });

  it('does not read workspace details when membership is rejected', async () => {
    workspaceAccess.requireMemberWorkspace.mockRejectedValue(
      new NotFoundException('Workspace was not found'),
    );

    await expect(
      service.findBySlug(workspace.slug, userId),
    ).rejects.toThrow(new NotFoundException('Workspace was not found'));
    expect(prisma.workspace.findUnique).not.toHaveBeenCalled();
  });

  it('lists only workspaces containing the authenticated user', async () => {
    prisma.workspace.findMany.mockResolvedValue([workspace]);

    const result = await service.findForMember(userId);

    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          members: {
            some: { userId },
          },
        },
      }),
    );
    expect(result.workspaces).toHaveLength(1);
  });
});
