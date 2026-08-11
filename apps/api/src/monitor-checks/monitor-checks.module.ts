import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { HostnameResolverService } from './hostname-resolver.service';
import { HttpCheckExecutorService } from './http-check-executor.service';
import { HttpHeaderClientService } from './http-header-client.service';
import { MonitorChecksController } from './monitor-checks.controller';
import { MonitorChecksService } from './monitor-checks.service';
import { TargetAddressPolicyService } from './target-address-policy.service';

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [MonitorChecksController],
  providers: [
    HostnameResolverService,
    TargetAddressPolicyService,
    HttpHeaderClientService,
    HttpCheckExecutorService,
    MonitorChecksService,
  ],
})
export class MonitorChecksModule {}
