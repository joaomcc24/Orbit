import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type {
  CreateWorkspaceResponse,
  GetWorkspaceResponse,
  ListWorkspacesResponse,
} from '@orbit/types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<CreateWorkspaceResponse> {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findForMember(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ListWorkspacesResponse> {
    return this.workspacesService.findForMember(user.id);
  }

  @Get(':slug')
  findBySlug(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ): Promise<GetWorkspaceResponse> {
    return this.workspacesService.findBySlug(slug, user.id);
  }
}
