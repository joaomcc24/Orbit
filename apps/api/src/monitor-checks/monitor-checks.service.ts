import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListMonitorChecksResponse,
  RunMonitorCheckResponse,
} from '@orbit/types';
import { isValidUuid } from '../common/validation';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import {
  toMonitorCheckSummary,
  toMonitorSummary,
} from '../monitors/monitor.mapper';
import { HttpCheckExecutorService } from './http-check-executor.service';

const defaultHistoryLimit = 20;
const maximumHistoryLimit = 100;

@Injectable()
export class MonitorChecksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly executor: HttpCheckExecutorService,
  ) {}

  async run(
    slug: string | undefined,
    monitorId: string,
    userId: string,
  ): Promise<RunMonitorCheckResponse> {
    const workspace = await this.workspaceAccess.requireMemberWorkspace(
      slug,
      userId,
    );
    const monitor = await this.requireWorkspaceMonitor(workspace.id, monitorId);
    const execution = await this.executor.execute(monitor.targetUrl);

    return this.prisma.$transaction(async (transaction) => {
      const currentMonitor = await transaction.monitor.findFirst({
        where: {
          id: monitor.id,
          workspaceId: workspace.id,
        },
      });

      if (!currentMonitor) {
        throw new NotFoundException('Monitor was not found');
      }

      const check = await transaction.monitorCheck.create({
        data: {
          monitorId: monitor.id,
          targetUrl: monitor.targetUrl,
          ...execution,
        },
      });

      await transaction.monitor.updateMany({
        where: {
          id: monitor.id,
          workspaceId: workspace.id,
          targetUrl: monitor.targetUrl,
          OR: [
            { lastCheckedAt: null },
            { lastCheckedAt: { lt: execution.checkedAt } },
          ],
        },
        data: {
          status: execution.result,
          lastCheckedAt: execution.checkedAt,
        },
      });

      const updatedMonitor = await transaction.monitor.findUnique({
        where: { id: monitor.id },
      });

      if (!updatedMonitor) {
        throw new NotFoundException('Monitor was not found');
      }

      return {
        monitor: toMonitorSummary(updatedMonitor),
        check: toMonitorCheckSummary(check),
      };
    });
  }

  async list(
    slug: string | undefined,
    monitorId: string,
    userId: string,
    requestedLimit: string | undefined,
  ): Promise<ListMonitorChecksResponse> {
    const workspace = await this.workspaceAccess.requireMemberWorkspace(
      slug,
      userId,
    );
    const monitor = await this.requireWorkspaceMonitor(workspace.id, monitorId);
    const limit = this.parseLimit(requestedLimit);
    const checks = await this.prisma.monitorCheck.findMany({
      where: { monitorId: monitor.id },
      orderBy: [{ checkedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return {
      checks: checks.map(toMonitorCheckSummary),
    };
  }

  private async requireWorkspaceMonitor(
    workspaceId: string,
    monitorId: string,
  ) {
    if (!isValidUuid(monitorId)) {
      throw new NotFoundException('Monitor was not found');
    }

    const monitor = await this.prisma.monitor.findFirst({
      where: {
        id: monitorId,
        workspaceId,
      },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor was not found');
    }

    return monitor;
  }

  private parseLimit(requestedLimit: string | undefined): number {
    if (requestedLimit === undefined) return defaultHistoryLimit;

    if (!/^\d+$/.test(requestedLimit)) {
      throw new BadRequestException('limit must be an integer from 1 to 100');
    }

    const limit = Number(requestedLimit);

    if (limit < 1 || limit > maximumHistoryLimit) {
      throw new BadRequestException('limit must be an integer from 1 to 100');
    }

    return limit;
  }
}
