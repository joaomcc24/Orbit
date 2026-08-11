import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MonitorChecksModule } from './monitor-checks/monitor-checks.module';
import { MonitorsModule } from './monitors/monitors.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    WorkspacesModule,
    MonitorsModule,
    MonitorChecksModule,
  ],
})
export class AppModule {}
