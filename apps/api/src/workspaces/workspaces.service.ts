import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceResponse,
  ListWorkspacesResponse,
  WorkspaceSummary,
} from '@orbit/types';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { normalizeWorkspaceSlug } from './workspaces.validation';

const workspaceInclude = {
  members: {
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.WorkspaceInclude;

type WorkspaceWithMembers = Prisma.WorkspaceGetPayload<{
  include: typeof workspaceInclude;
}>;

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async create(
    userId: string,
    input: Partial<CreateWorkspaceRequest> | undefined,
  ): Promise<CreateWorkspaceResponse> {
    const data = this.normalizeCreateInput(input);

    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          members: {
            create: {
              role: 'OWNER',
              userId,
            },
          },
        },
        include: workspaceInclude,
      });

      return {
        workspace: this.toWorkspaceSummary(workspace),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'slug')) {
        throw new ConflictException('Workspace slug is already in use');
      }

      throw error;
    }
  }

  async findBySlug(
    slug: string,
    userId: string,
  ): Promise<GetWorkspaceResponse> {
    const memberWorkspace = await this.workspaceAccess.requireMemberWorkspace(
      slug,
      userId,
    );
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: memberWorkspace.id,
      },
      include: workspaceInclude,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace was not found');
    }

    return {
      workspace: this.toWorkspaceSummary(workspace),
    };
  }

  async findForMember(userId: string): Promise<ListWorkspacesResponse> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: workspaceInclude,
      orderBy: [{ createdAt: 'asc' }, { slug: 'asc' }],
    });

    return {
      workspaces: workspaces.map((workspace) =>
        this.toWorkspaceSummary(workspace),
      ),
    };
  }

  private normalizeCreateInput(
    input: Partial<CreateWorkspaceRequest> | undefined,
  ): CreateWorkspaceRequest {
    const name = input?.name?.trim();
    const rawSlug = input?.slug?.trim();

    if (!name || !rawSlug) {
      throw new BadRequestException('name and slug are required');
    }

    const slug = normalizeWorkspaceSlug(rawSlug);

    if (name.length > 80) {
      throw new BadRequestException('Workspace name must be 80 characters or less');
    }

    return {
      name,
      slug,
    };
  }

  private toWorkspaceSummary(
    workspace: WorkspaceWithMembers,
  ): WorkspaceSummary {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
      members: workspace.members.map((member) => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        user: {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name,
          createdAt: member.user.createdAt.toISOString(),
        },
      })),
    };
  }

  private isUniqueConstraintError(error: unknown, field: string): boolean {
    const prismaError = error as {
      code?: string;
      meta?: {
        target?: unknown;
        driverAdapterError?: {
          cause?: {
            constraint?: {
              fields?: unknown;
            };
          };
        };
      };
    };

    if (prismaError.code !== 'P2002') {
      return false;
    }

    const target = prismaError.meta?.target;
    const adapterFields =
      prismaError.meta?.driverAdapterError?.cause?.constraint?.fields;

    return (
      this.fieldListIncludes(target, field) ||
      this.fieldListIncludes(adapterFields, field)
    );
  }

  private fieldListIncludes(fields: unknown, field: string): boolean {
    return Array.isArray(fields) && fields.includes(field);
  }
}
