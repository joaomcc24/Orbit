import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type {
  CreateMonitorResponse,
  ListMonitorsResponse,
} from '@orbit/types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { MonitorsService } from './monitors.service';

@Controller('workspaces/:slug/monitors')
@UseGuards(JwtAuthGuard)
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() createMonitorDto: CreateMonitorDto,
  ): Promise<CreateMonitorResponse> {
    return this.monitorsService.create(slug, user.id, createMonitorDto);
  }

  @Get()
  findForWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ): Promise<ListMonitorsResponse> {
    return this.monitorsService.findForWorkspace(slug, user.id);
  }
}
