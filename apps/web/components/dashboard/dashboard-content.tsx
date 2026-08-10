'use client';

import { useEffect, useState } from 'react';
import { Bell, LogOut, RadioTower, Search } from 'lucide-react';
import type { MonitorSummary } from '@orbit/types';
import { MetricCard, StatusBadge, type StatusTone } from '@/components/orbit';
import { OrbitApiError, orbitApi } from '@/lib/api';
import { useWorkspace } from '@/components/workspaces/workspace-provider';
import { WorkspaceSwitcher } from '@/components/workspaces/workspace-switcher';
import { MonitorOverview } from './monitor-overview';
import { NewMonitorDialog, type NewMonitorInput } from './new-monitor-dialog';
import type { Monitor } from './types';
import { SESSION_EXPIRED_MESSAGE, useAuth } from '@/components/auth/auth-provider';

export function DashboardContent(): React.ReactNode {
  const { accessToken, logout, expireSession } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
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
        if (!ignoreResult) setMonitors(response.monitors.map(monitorFromApi));
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
      const monitor = monitorFromApi(response.monitor);
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

  const hasWorkspace = Boolean(activeWorkspace);
  const pendingCount = monitors.filter((monitor) => monitor.tone === 'neutral').length;
  const metrics = [
    { label: 'Configured', value: hasWorkspace ? String(monitors.length) : '—', detail: hasWorkspace ? 'Saved in this workspace' : 'Choose a workspace first', tone: 'neutral' as StatusTone },
    { label: 'Pending checks', value: hasWorkspace ? String(pendingCount) : '—', detail: 'A checker will activate these', tone: 'info' as StatusTone },
    { label: 'Median latency', value: '—', detail: 'Available after checks run', tone: 'neutral' as StatusTone },
    { label: 'Open incidents', value: '—', detail: 'Available after checks run', tone: 'neutral' as StatusTone },
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
              <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-[#f3f1ff] sm:text-4xl">{hasWorkspace ? 'Your monitor configuration is ready.' : 'Start with a workspace.'}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748b]">{hasWorkspace ? 'HTTP monitor configuration is saved through the Orbit API. Results will appear only after the check worker is built.' : 'Use the workspace switcher to create your first workspace.'}</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
              <MiniStat label="Workspace" value={activeWorkspace ? 'Connected' : 'None'} />
              <MiniStat label="Monitors" value={hasWorkspace ? String(monitors.length) : '—'} />
              <MiniStat label="Checks" value="Pending" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <p className="sr-only" aria-live="polite">{announcement}</p>
        <MonitorOverview
          monitors={monitors}
          isLoading={isLoadingMonitors}
          error={monitorError}
          onRetry={() => setReloadKey((current) => current + 1)}
          emptyMessage={hasWorkspace ? 'No monitor configuration is saved in this workspace yet.' : 'Choose a workspace to load its monitor configuration.'}
        />

        <CheckEnginePlaceholder />
      </div>
    </section>
  );
}

function monitorFromApi(monitor: MonitorSummary): Monitor {
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.targetUrl,
    status: 'Pending',
    tone: 'neutral',
    uptime: '—',
    latency: '—',
    interval: intervalLabel(monitor.interval),
    checked: 'Awaiting first check',
    type: 'HTTP',
    ticks: Array.from({ length: 12 }, () => 'empty'),
    regions: [
      { code: 'iad', city: 'Washington', latency: 'Pending', tone: 'neutral' },
      { code: 'ams', city: 'Amsterdam', latency: 'Pending', tone: 'neutral' },
      { code: 'sin', city: 'Singapore', latency: 'Pending', tone: 'neutral' },
    ],
    responseTimes: [],
  };
}

function intervalLabel(interval: number): string {
  if (interval === 300) return '5m';
  return `${interval}s`;
}

function messageFor(error: unknown): string {
  if (error instanceof OrbitApiError) return error.message;
  return 'Orbit could not load monitor configuration.';
}

function MiniStat({ label, value }: { label: string; value: string }): React.ReactNode {
  return <div className="min-w-0 px-3 py-2"><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#162033]">{value}</p></div>;
}

function CheckEnginePlaceholder(): React.ReactNode {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-md border border-dashed border-[#292f4d] bg-white p-5">
        <RadioTower className="size-5 text-[#a79fff]" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-[#162033]">Check activity comes next</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748b]">Orbit has real monitor configuration now. The next worker will make HTTP requests from check regions and write results here—without inventing uptime or latency before then.</p>
      </div>
      <div className="rounded-md border border-dashed border-[#292f4d] bg-white p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a79fff]">Next foundation</p>
        <h2 className="mt-3 font-semibold text-[#162033]">A scheduled check worker</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748b]">It will claim due monitors, execute safe HTTP checks, persist measurements, and later drive the activity, regional, uptime, and incident views.</p>
      </div>
    </section>
  );
}
