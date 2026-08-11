import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type {
  ListMonitorChecksResponse,
  RunMonitorCheckResponse,
} from '@orbit/types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonitorChecksService } from './monitor-checks.service';

@Controller('workspaces/:slug/monitors/:monitorId/checks')
@UseGuards(JwtAuthGuard)
export class MonitorChecksController {
  constructor(private readonly monitorChecksService: MonitorChecksService) {}

  @Post()
  run(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Param('monitorId') monitorId: string,
  ): Promise<RunMonitorCheckResponse> {
    return this.monitorChecksService.run(slug, monitorId, user.id);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Param('monitorId') monitorId: string,
    @Query('limit') limit: string | undefined,
  ): Promise<ListMonitorChecksResponse> {
    return this.monitorChecksService.list(slug, monitorId, user.id, limit);
  }
}
