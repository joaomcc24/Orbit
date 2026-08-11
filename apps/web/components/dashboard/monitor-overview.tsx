'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import type {
  ListMonitorChecksResponse,
  MonitorCheckSummary,
  MonitorSummary,
  RunMonitorCheckResponse,
} from '@orbit/types';
import { StatusBadge, type StatusTone } from '@/components/orbit';

export function MonitorOverview({
  monitors,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No monitor configuration is available yet.',
  onLoadChecks,
  onRunCheck,
}: {
  monitors: MonitorSummary[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  onLoadChecks: (monitor: MonitorSummary) => Promise<ListMonitorChecksResponse>;
  onRunCheck: (monitor: MonitorSummary) => Promise<RunMonitorCheckResponse>;
}): React.ReactNode {
  const [selectedMonitor, setSelectedMonitor] = useState<MonitorSummary | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedMonitor) return undefined;

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setSelectedMonitor(null);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedMonitor]);

  useEffect(() => {
    if (selectedMonitor) drawerRef.current?.focus();
  }, [selectedMonitor]);

  const openMonitor = (monitor: MonitorSummary, trigger: HTMLButtonElement): void => {
    triggerRef.current = trigger;
    setSelectedMonitor(monitor);
  };

  const closeMonitor = (): void => {
    setSelectedMonitor(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <>
      <section className="overflow-hidden rounded-md border border-[#d8dee8] bg-white" aria-labelledby="monitors-heading">
        <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="monitors-heading" className="font-semibold text-[#162033]">
              Monitors <span className="ml-1.5 align-middle font-mono text-xs font-normal text-[#64748b]">{monitors.length}</span>
            </h2>
            <p className="text-sm text-[#64748b]">Open a monitor to run a check or review its saved results.</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{isLoading ? 'Loading' : `${monitors.length} configured`}</span>
        </div>

        {isLoading ? <LoadingRows /> : null}
        {!isLoading && error ? (
          <div className="flex flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-[#fb7185]">{error}</p>
            {onRetry ? <button type="button" onClick={onRetry} className="h-9 rounded-md border border-[#7f3445] px-3 text-sm font-medium text-[#fb7185]">Try again</button> : null}
          </div>
        ) : null}
        {!isLoading && !error && monitors.length === 0 ? <div className="px-4 py-10 text-center text-sm leading-6 text-[#64748b]">{emptyMessage}</div> : null}
        {!isLoading && !error && monitors.length > 0 ? (
          <>
            <div className="hidden grid-cols-[1.5fr_0.8fr_0.9fr_0.55fr_0.2fr] border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b] lg:grid">
              <span>Monitor</span>
              <span>Status</span>
              <span>Last check</span>
              <span>Interval</span>
              <span />
            </div>
            <div className="divide-y divide-[#eef2f7]">
              {monitors.map((monitor) => <MonitorRow key={monitor.id} monitor={monitor} onOpen={(trigger) => openMonitor(monitor, trigger)} />)}
            </div>
          </>
        ) : null}
      </section>

      {selectedMonitor ? (
        <MonitorDrawer
          monitor={selectedMonitor}
          drawerRef={drawerRef}
          onClose={closeMonitor}
          onLoadChecks={onLoadChecks}
          onRunCheck={onRunCheck}
        />
      ) : null}
    </>
  );
}

function LoadingRows(): React.ReactNode {
  return (
    <div className="space-y-3 px-4 py-5" aria-label="Loading monitors">
      {[0, 1, 2].map((index) => <div key={index} className="h-12 animate-pulse rounded-md bg-[#f8fafc]" />)}
    </div>
  );
}

function MonitorRow({ monitor, onOpen }: { monitor: MonitorSummary; onOpen: (trigger: HTMLButtonElement) => void }): React.ReactNode {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      className="grid w-full gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-[#171b3c] focus-visible:bg-[#171b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7165ff] lg:grid-cols-[1.5fr_0.8fr_0.9fr_0.55fr_0.2fr] lg:items-center"
      aria-label={`Open details for ${monitor.name}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-[#162033]">{monitor.name}</p>
        <p className="truncate text-sm text-[#64748b]">{monitor.targetUrl}</p>
      </div>
      <div className="flex items-center justify-between gap-3 lg:block">
        <StatusBadge tone={monitorTone(monitor.status)}>{monitor.status}</StatusBadge>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b] lg:hidden">{lastCheckLabel(monitor.lastCheckedAt)}</span>
      </div>
      <span className="hidden text-sm text-[#475569] lg:block">{lastCheckLabel(monitor.lastCheckedAt)}</span>
      <span className="text-sm text-[#475569]">{intervalLabel(monitor.interval)}</span>
      <ChevronRight className="hidden size-4 text-[#64748b] lg:block" aria-hidden="true" />
    </button>
  );
}

function MonitorDrawer({
  monitor,
  drawerRef,
  onClose,
  onLoadChecks,
  onRunCheck,
}: {
  monitor: MonitorSummary;
  drawerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onLoadChecks: (monitor: MonitorSummary) => Promise<ListMonitorChecksResponse>;
  onRunCheck: (monitor: MonitorSummary) => Promise<RunMonitorCheckResponse>;
}): React.ReactNode {
  const [currentMonitor, setCurrentMonitor] = useState(monitor);
  const [checks, setChecks] = useState<MonitorCheckSummary[]>([]);
  const [isLoadingChecks, setIsLoadingChecks] = useState(true);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMonitor(monitor);
  }, [monitor]);

  const loadChecks = useCallback(async (): Promise<void> => {
    setIsLoadingChecks(true);
    setHistoryError(null);
    try {
      const response = await onLoadChecks(currentMonitor);
      setChecks(response.checks);
    } catch (caughtError) {
      setHistoryError(messageFor(caughtError, 'Orbit could not load this check history.'));
    } finally {
      setIsLoadingChecks(false);
    }
  }, [currentMonitor, onLoadChecks]);

  useEffect(() => {
    void loadChecks();
  }, [loadChecks]);

  const runCheck = async (): Promise<void> => {
    setIsRunningCheck(true);
    setRunError(null);
    setRunMessage(null);
    try {
      const response = await onRunCheck(currentMonitor);
      setCurrentMonitor(response.monitor);
      setChecks((current) => [response.check, ...current.filter((check) => check.id !== response.check.id)]);
      setRunMessage(response.check.result === 'UP' ? 'Check completed successfully.' : 'Check completed with a failure result.');
    } catch (caughtError) {
      setRunError(messageFor(caughtError, 'Orbit could not run this check.'));
    } finally {
      setIsRunningCheck(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#03050d]/70 p-0 backdrop-blur-[2px]" role="presentation" onMouseDown={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#292f4d] bg-[#0d101f] shadow-[-24px_0_70px_rgb(3_5_13_/_0.4)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monitor-drawer-title"
        aria-describedby="monitor-drawer-description"
        ref={drawerRef}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#292f4d] bg-[#0d101f]/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={monitorTone(currentMonitor.status)}>{currentMonitor.status}</StatusBadge>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9499b3]">HTTP monitor</span>
            </div>
            <h2 id="monitor-drawer-title" className="mt-3 truncate text-xl font-semibold text-[#f3f1ff]">{currentMonitor.name}</h2>
            <p id="monitor-drawer-description" className="mt-1 truncate font-mono text-[11px] text-[#9499b3]">{currentMonitor.targetUrl}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-md border border-[#292f4d] text-[#cfd2e5] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7165ff]" aria-label="Close monitor details">
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 px-5 py-5 sm:px-6">
          <section className="grid grid-cols-3 divide-x divide-[#292f4d] overflow-hidden rounded-md border border-[#292f4d] bg-[#101426]">
            <DrawerStat label="Status" value={currentMonitor.status} />
            <DrawerStat label="Last checked" value={lastCheckLabel(currentMonitor.lastCheckedAt)} />
            <DrawerStat label="Interval" value={intervalLabel(currentMonitor.interval)} />
          </section>

          <section className="rounded-md border border-[#292f4d] bg-[#101426] p-4" aria-labelledby="run-check-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 id="run-check-heading" className="font-medium text-[#f3f1ff]">Manual check</h3>
                <p className="mt-1 text-sm leading-5 text-[#9499b3]">Makes one real HTTP request now and saves the result to this monitor.</p>
              </div>
              <button type="button" onClick={() => void runCheck()} disabled={isRunningCheck} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#7165ff] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d101f] disabled:cursor-not-allowed disabled:opacity-60">
                {isRunningCheck ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                {isRunningCheck ? 'Checking…' : 'Run check'}
              </button>
            </div>
            {runMessage ? <p className="mt-3 border-l-2 border-[#2dd4bf] pl-3 text-sm text-[#99f6e4]" role="status">{runMessage}</p> : null}
            {runError ? <p className="mt-3 border-l-2 border-[#fb7185] pl-3 text-sm text-[#fda4af]" role="alert">{runError}</p> : null}
          </section>

          <section className="overflow-hidden rounded-md border border-[#292f4d] bg-[#101426]" aria-labelledby="check-history-heading">
            <div className="flex items-center justify-between gap-3 border-b border-[#292f4d] px-4 py-3">
              <div>
                <h3 id="check-history-heading" className="font-medium text-[#f3f1ff]">Recent check history</h3>
                <p className="mt-0.5 text-sm text-[#9499b3]">The latest persisted results for this monitor.</p>
              </div>
              <button type="button" onClick={() => void loadChecks()} disabled={isLoadingChecks || isRunningCheck} className="grid size-8 shrink-0 place-items-center rounded-md border border-[#292f4d] text-[#cfd2e5] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7165ff] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Refresh check history" title="Refresh check history">
                <RefreshCw className={`size-3.5 ${isLoadingChecks ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
            {isLoadingChecks ? <HistoryLoading /> : null}
            {!isLoadingChecks && historyError ? <HistoryError error={historyError} onRetry={() => void loadChecks()} /> : null}
            {!isLoadingChecks && !historyError && checks.length === 0 ? <HistoryEmpty /> : null}
            {!isLoadingChecks && !historyError && checks.length > 0 ? <CheckList checks={checks} /> : null}
          </section>
        </div>
      </aside>
    </div>
  );
}

function HistoryLoading(): React.ReactNode {
  return <div className="space-y-3 px-4 py-4" aria-label="Loading recent check history">{[0, 1, 2].map((index) => <div key={index} className="h-14 animate-pulse rounded-md bg-white/[0.04]" />)}</div>;
}

function HistoryError({ error, onRetry }: { error: string; onRetry: () => void }): React.ReactNode {
  return (
    <div className="px-4 py-5">
      <p className="text-sm leading-6 text-[#fda4af]">{error}</p>
      <button type="button" onClick={onRetry} className="mt-3 h-8 rounded-md border border-[#7f3445] px-2.5 text-xs font-medium text-[#fda4af]">Try again</button>
    </div>
  );
}

function HistoryEmpty(): React.ReactNode {
  return (
    <div className="px-5 py-10 text-center">
      <Clock3 className="mx-auto size-5 text-[#717793]" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-[#cfd2e5]">No saved checks yet</p>
      <p className="mt-1 text-sm leading-5 text-[#9499b3]">Run a manual check to create the first persisted result.</p>
    </div>
  );
}

function CheckList({ checks }: { checks: MonitorCheckSummary[] }): React.ReactNode {
  return (
    <ul className="divide-y divide-[#292f4d]">
      {checks.map((check) => (
        <li key={check.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge tone={check.result === 'UP' ? 'success' : 'danger'}>{check.result}</StatusBadge>
              <span className="font-mono text-xs text-[#cfd2e5]">{check.responseTimeMs} ms</span>
            </div>
            <time dateTime={check.checkedAt} className="text-xs text-[#9499b3]" title={fullDateTime(check.checkedAt)}>{relativeTime(check.checkedAt)}</time>
          </div>
          <p className="mt-2 text-sm text-[#cfd2e5]">{statusLine(check)}</p>
          {check.result === 'DOWN' ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#7f3445] bg-[#321923] px-2.5 py-2 text-xs leading-5 text-[#fda4af]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <p><span className="font-mono font-semibold">{failureLabel(check.failureReason)}</span>{check.errorMessage ? ` — ${check.errorMessage}` : ''}</p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function DrawerStat({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#9499b3]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#f3f1ff]">{value}</p>
    </div>
  );
}

function monitorTone(status: MonitorSummary['status']): StatusTone {
  if (status === 'UP') return 'success';
  if (status === 'DOWN') return 'danger';
  return 'neutral';
}

function intervalLabel(interval: number): string {
  if (interval === 300) return '5 min';
  return `${interval} sec`;
}

function lastCheckLabel(checkedAt: string | null): string {
  return checkedAt ? relativeTime(checkedAt) : 'Not checked';
}

function statusLine(check: MonitorCheckSummary): string {
  if (check.httpStatusCode) return `HTTP ${check.httpStatusCode}`;
  return check.result === 'UP' ? 'Request completed' : 'No HTTP response received';
}

function failureLabel(reason: MonitorCheckSummary['failureReason']): string {
  return reason ? reason.replaceAll('_', ' ') : 'CHECK FAILED';
}

function relativeTime(value: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function fullDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
