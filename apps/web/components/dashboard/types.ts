import type { CheckState, StatusTone } from '@/components/orbit';

export type MonitorRegion = {
  code: string;
  city: string;
  latency: string;
  tone: StatusTone;
};

export type Monitor = {
  id: string;
  name: string;
  url: string;
  status: string;
  tone: StatusTone;
  uptime: string;
  latency: string;
  interval: string;
  checked: string;
  type: string;
  ticks: CheckState[];
  regions: MonitorRegion[];
  responseTimes: number[];
};
