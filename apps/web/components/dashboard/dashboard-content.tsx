'use client';

import { useEffect, useState } from 'react';
import { Bell, LogOut, Play, Search } from 'lucide-react';
import type {
  ListMonitorChecksResponse,
  MonitorSummary,
  RunMonitorCheckResponse,
} from '@orbit/types';
import { MetricCard, StatusBadge, type StatusTone } from '@/components/orbit';
import { OrbitApiError, orbitApi } from '@/lib/api';
import { useWorkspace } from '@/components/workspaces/workspace-provider';
import { WorkspaceSwitcher } from '@/components/workspaces/workspace-switcher';
import { MonitorOverview } from './monitor-overview';
import { NewMonitorDialog, type NewMonitorInput } from './new-monitor-dialog';
import { SESSION_EXPIRED_MESSAGE, useAuth } from '@/components/auth/auth-provider';

export function DashboardContent(): React.ReactNode {
  const { accessToken, logout, expireSession } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [monitors, setMonitors] = useState<MonitorSummary[]>([]);
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(false);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!activeWorkspace || !accessToken) {
      setMonitors([]);
      setMonitorError(null);
      setIsLoadingMonitors(false);
      return undefined;
    }

    let ignoreResult = false;
    setIsLoadingMonitors(true);
    setMonitorError(null);

    void orbitApi.listMonitors(activeWorkspace.slug, accessToken)
      .then((response) => {
        if (!ignoreResult) setMonitors(response.monitors);
      })
      .catch((caughtError) => {
        if (!ignoreResult) {
          if (caughtError instanceof OrbitApiError && caughtError.status === 401) expireSession();
          else setMonitorError(messageFor(caughtError));
        }
      })
      .finally(() => {
        if (!ignoreResult) setIsLoadingMonitors(false);
      });

    return () => {
      ignoreResult = true;
    };
  }, [activeWorkspace?.slug, accessToken, expireSession, reloadKey]);

  const createMonitor = async (input: NewMonitorInput): Promise<void> => {
    if (!activeWorkspace || !accessToken) {
      throw new Error('Choose a workspace before creating a monitor.');
    }

    try {
      const response = await orbitApi.createMonitor(activeWorkspace.slug, accessToken, input);
      const { monitor } = response;
      setMonitors((current) => [...current, monitor]);
      setAnnouncement(`${monitor.name} was saved to ${activeWorkspace.name} and is awaiting its first check.`);
    } catch (caughtError) {
      if (caughtError instanceof OrbitApiError && caughtError.status === 401) {
        expireSession();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

      throw caughtError;
    }
  };

  const loadMonitorChecks = async (monitor: MonitorSummary): Promise<ListMonitorChecksResponse> => {
    if (!activeWorkspace || !accessToken) {
      throw new Error('Choose a workspace before viewing monitor checks.');
    }

    try {
      return await orbitApi.listMonitorChecks(activeWorkspace.slug, monitor.id, accessToken);
    } catch (caughtError) {
      if (caughtError instanceof OrbitApiError && caughtError.status === 401) {
        expireSession();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

      throw caughtError;
    }
  };

  const runMonitorCheck = async (monitor: MonitorSummary): Promise<RunMonitorCheckResponse> => {
    if (!activeWorkspace || !accessToken) {
      throw new Error('Choose a workspace before running a monitor check.');
    }

    try {
      const response = await orbitApi.runMonitorCheck(activeWorkspace.slug, monitor.id, accessToken);
      setMonitors((current) => current.map((item) => item.id === response.monitor.id ? response.monitor : item));
      setAnnouncement(`${monitor.name} is ${response.check.result.toLowerCase()} after a manual check.`);
      return response;
    } catch (caughtError) {
      if (caughtError instanceof OrbitApiError && caughtError.status === 401) {
        expireSession();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

      throw caughtError;
    }
  };

  const hasWorkspace = Boolean(activeWorkspace);
  const pendingCount = monitors.filter((monitor) => monitor.status === 'PENDING').length;
  const metrics = [
    { label: 'Configured', value: hasWorkspace ? String(monitors.length) : '—', detail: hasWorkspace ? 'Saved in this workspace' : 'Choose a workspace first', tone: 'neutral' as StatusTone },
    { label: 'Awaiting first check', value: hasWorkspace ? String(pendingCount) : '—', detail: 'Run a manual HTTP check to update status', tone: 'info' as StatusTone },
  ];

  return (
    <section className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-[#d8dee8] bg-white/95 px-4 py-3 sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#64748b]">Orbit / {activeWorkspace?.name ?? 'Development'}</p>
              <h1 className="mt-1 text-2xl font-semibold text-[#162033]">Service health</h1>
            </div>
            <div className="pt-0.5 lg:hidden"><WorkspaceSwitcher compact /></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-[#d8dee8] bg-[#f8fafc] px-3 text-sm text-[#64748b] sm:w-80" role="search" aria-label="Monitor search is not available yet">
              <Search className="size-4" aria-hidden="true" />
              <span className="truncate">Search monitors, incidents, teams</span>
            </div>
            <button disabled title="Notifications will be connected with the alerting API." className="grid size-10 cursor-not-allowed place-items-center rounded-md border border-[#d8dee8] bg-white text-[#64748b] opacity-70" aria-label="Notifications are not configured yet">
              <Bell className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={logout} className="grid size-10 place-items-center rounded-md border border-[#d8dee8] bg-white text-[#64748b] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf] lg:hidden" aria-label="Sign out" title="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </button>
            <NewMonitorDialog onCreate={createMonitor} disabled={!hasWorkspace} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
        <section className="rounded-md border border-[#d8dee8] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <StatusBadge tone={hasWorkspace ? 'info' : 'neutral'}>{hasWorkspace ? 'Workspace connected' : 'Workspace required'}</StatusBadge>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-[#f3f1ff] sm:text-4xl">{hasWorkspace ? 'Run a check. See what happened.' : 'Start with a workspace.'}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748b]">{hasWorkspace ? 'Open a monitor to run one real HTTP check and inspect its saved result. Automatic scheduling is intentionally not enabled yet.' : 'Use the workspace switcher to create your first workspace.'}</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
              <MiniStat label="Workspace" value={activeWorkspace ? 'Connected' : 'None'} />
              <MiniStat label="Monitors" value={hasWorkspace ? String(monitors.length) : '—'} />
              <MiniStat label="Manual checks" value="Ready" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <p className="sr-only" aria-live="polite">{announcement}</p>
        <MonitorOverview
          monitors={monitors}
          isLoading={isLoadingMonitors}
          error={monitorError}
          onRetry={() => setReloadKey((current) => current + 1)}
          emptyMessage={hasWorkspace ? 'No monitor configuration is saved in this workspace yet.' : 'Choose a workspace to load its monitor configuration.'}
          onLoadChecks={loadMonitorChecks}
          onRunCheck={runMonitorCheck}
        />

        <section className="flex flex-col gap-3 rounded-md border border-dashed border-[#292f4d] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a79fff]">Manual checks</p>
            <h2 className="mt-2 font-semibold text-[#162033]">Each result is persisted and belongs to its monitor.</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748b]">Open a monitor to run a single real check. Scheduling, alerts, and aggregate uptime remain future foundations rather than simulated dashboard data.</p>
          </div>
          <Play className="size-5 shrink-0 text-[#a79fff]" aria-hidden="true" />
        </section>
      </div>
    </section>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof OrbitApiError) return error.message;
  return 'Orbit could not load monitor configuration.';
}

function MiniStat({ label, value }: { label: string; value: string }): React.ReactNode {
  return <div className="min-w-0 px-3 py-2"><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#162033]">{value}</p></div>;
}
