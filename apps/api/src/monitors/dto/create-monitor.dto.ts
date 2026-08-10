import type { CreateMonitorRequest, MonitorInterval } from '@orbit/types';

export class CreateMonitorDto implements CreateMonitorRequest {
  name!: string;
  targetUrl!: string;
  interval!: MonitorInterval;
}
