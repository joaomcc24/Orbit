import type { CreateWorkspaceRequest } from '@orbit/types';

export class CreateWorkspaceDto implements CreateWorkspaceRequest {
  name!: string;
  slug!: string;
}
