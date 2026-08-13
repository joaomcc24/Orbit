import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  readiness(): Promise<{ status: 'ok'; database: 'ok'; timestamp: string }> {
    return this.healthService.check();
  }

  @Get('ready')
  ready(): Promise<{ status: 'ok'; database: 'ok'; timestamp: string }> {
    return this.healthService.check();
  }

  @Get('live')
  live(): { status: 'ok'; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ping')
  ping(): { status: 'ok'; timestamp: string } {
    return this.live();
  }
}
