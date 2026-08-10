import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeWorkspaceSlug } from './workspaces.validation';

export type MemberWorkspaceIdentity = {
  id: string;
  slug: string;
};

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMemberWorkspace(
    slug: string | undefined,
    userId: string,
  ): Promise<MemberWorkspaceIdentity> {
    const normalizedSlug = normalizeWorkspaceSlug(slug);
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        slug: normalizedSlug,
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

    if (!workspace) {
      throw new NotFoundException('Workspace was not found');
    }

    return workspace;
  }
}
