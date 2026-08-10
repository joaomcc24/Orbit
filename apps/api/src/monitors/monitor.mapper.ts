import type { Monitor, MonitorCheck } from '@prisma/client';
import type {
  MonitorCheckSummary,
  MonitorInterval,
  MonitorSummary,
} from '@orbit/types';

export function toMonitorSummary(monitor: Monitor): MonitorSummary {
  return {
    id: monitor.id,
    workspaceId: monitor.workspaceId,
    name: monitor.name,
    targetUrl: monitor.targetUrl,
    interval: monitor.interval as MonitorInterval,
    status: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt?.toISOString() ?? null,
    createdAt: monitor.createdAt.toISOString(),
    updatedAt: monitor.updatedAt.toISOString(),
  };
}
export function toMonitorCheckSummary(
  check: MonitorCheck,
): MonitorCheckSummary {
  return {
    id: check.id,
    monitorId: check.monitorId,
    result: check.result,
    failureReason: check.failureReason,
    targetUrl: check.targetUrl,
    httpStatusCode: check.httpStatusCode,
    responseTimeMs: check.responseTimeMs,
    checkedAt: check.checkedAt.toISOString(),
    errorMessage: check.errorMessage,
  };
}
