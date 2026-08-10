import { BadRequestException, Injectable } from '@nestjs/common';
import type { Monitor as PrismaMonitor } from '@prisma/client';
import type {
  CreateMonitorRequest,
  CreateMonitorResponse,
  ListMonitorsResponse,
  MonitorInterval,
  MonitorSummary,
} from '@orbit/types';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

const allowedIntervals = new Set<number>([30, 60, 300]);

@Injectable()
export class MonitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async create(
    slug: string | undefined,
    userId: string,
    input: Partial<CreateMonitorRequest> | undefined,
  ): Promise<CreateMonitorResponse> {
    const workspace = await this.workspaceAccess.requireMemberWorkspace(
      slug,
      userId,
    );
    const data = this.normalizeCreateInput(input);
    const monitor = await this.prisma.monitor.create({
      data: {
        ...data,
        status: 'PENDING',
        workspaceId: workspace.id,
      },
    });

    return {
      monitor: this.toMonitorSummary(monitor),
    };
  }

  async findForWorkspace(
    slug: string | undefined,
    userId: string,
  ): Promise<ListMonitorsResponse> {
    const workspace = await this.workspaceAccess.requireMemberWorkspace(
      slug,
      userId,
    );
    const monitors = await this.prisma.monitor.findMany({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      monitors: monitors.map((monitor) => this.toMonitorSummary(monitor)),
    };
  }

  private normalizeCreateInput(
    input: Partial<CreateMonitorRequest> | undefined,
  ): CreateMonitorRequest {
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    const targetUrl =
      typeof input?.targetUrl === 'string' ? input.targetUrl.trim() : '';
    const interval = input?.interval;

    if (!name || !targetUrl || interval === undefined) {
      throw new BadRequestException(
        'name, targetUrl, and interval are required',
      );
    }

    if (name.length > 80) {
      throw new BadRequestException(
        'Monitor name must be 80 characters or less',
      );
    }

    if (targetUrl.length > 2048) {
      throw new BadRequestException(
        'Monitor target URL must be 2048 characters or less',
      );
    }

    this.assertHttpUrl(targetUrl);

    if (!allowedIntervals.has(interval)) {
      throw new BadRequestException(
        'Monitor interval must be 30, 60, or 300 seconds',
      );
    }

    return {
      name,
      targetUrl,
      interval,
    };
  }

  private assertHttpUrl(targetUrl: string): void {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      throw new BadRequestException(
        'Monitor target URL must be a valid HTTP or HTTPS URL',
      );
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException(
        'Monitor target URL must be a valid HTTP or HTTPS URL',
      );
    }
  }

  private toMonitorSummary(monitor: PrismaMonitor): MonitorSummary {
    return {
      id: monitor.id,
      workspaceId: monitor.workspaceId,
      name: monitor.name,
      targetUrl: monitor.targetUrl,
      interval: monitor.interval as MonitorInterval,
      status: monitor.status,
      createdAt: monitor.createdAt.toISOString(),
      updatedAt: monitor.updatedAt.toISOString(),
    };
  }
}
