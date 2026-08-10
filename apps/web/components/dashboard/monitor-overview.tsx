'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, ExternalLink, MoreHorizontal, X } from 'lucide-react';
import { CheckHistory, StatusBadge, ToneDot } from '@/components/orbit';
import type { Monitor } from './types';

export function MonitorOverview({
  monitors,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No monitor configuration is available yet.',
}: {
  monitors: Monitor[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
}): React.ReactNode {
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
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

  const openMonitor = (monitor: Monitor, trigger: HTMLButtonElement): void => {
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
              Live monitors <span className="ml-1.5 align-middle font-mono text-xs font-normal text-[#64748b]">{monitors.length}</span>
            </h2>
            <p className="text-sm text-[#64748b]">Select a monitor to review checks, regions, and alerting.</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{isLoading ? 'Loading' : `${monitors.length} configured`}</span>
        </div>

        {isLoading ? <div className="px-4 py-10 text-center text-sm text-[#64748b]">Loading monitor configuration…</div> : null}
        {!isLoading && error ? (
          <div className="flex flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-[#fb7185]">{error}</p>
            {onRetry ? <button type="button" onClick={onRetry} className="h-9 rounded-md border border-[#7f3445] px-3 text-sm font-medium text-[#fb7185]">Try again</button> : null}
          </div>
        ) : null}
        {!isLoading && !error && monitors.length === 0 ? <div className="px-4 py-10 text-center text-sm leading-6 text-[#64748b]">{emptyMessage}</div> : null}
        {!isLoading && !error && monitors.length > 0 ? (
          <>
            <div className="hidden grid-cols-[1.4fr_0.8fr_1fr_0.65fr_0.6fr_0.4fr] border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b] lg:grid">
              <span>Monitor</span>
              <span>Status</span>
              <span>Last checks</span>
              <span>Interval</span>
              <span>Uptime</span>
              <span />
            </div>
            <div className="divide-y divide-[#eef2f7]">
              {monitors.map((monitor) => <MonitorRow key={monitor.id} monitor={monitor} onOpen={(trigger) => openMonitor(monitor, trigger)} />)}
            </div>
          </>
        ) : null}
      </section>

      {selectedMonitor ? <MonitorDrawer monitor={selectedMonitor} drawerRef={drawerRef} onClose={closeMonitor} /> : null}
    </>
  );
}

function MonitorRow({ monitor, onOpen }: { monitor: Monitor; onOpen: (trigger: HTMLButtonElement) => void }): React.ReactNode {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      className="grid w-full gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-[#171b3c] focus-visible:bg-[#171b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7165ff] lg:grid-cols-[1.4fr_0.8fr_1fr_0.65fr_0.6fr_0.4fr] lg:items-center"
      aria-label={`Open details for ${monitor.name}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-[#162033]">{monitor.name}</p>
        <p className="truncate text-sm text-[#64748b]">{monitor.url}</p>
      </div>
      <div className="flex items-center justify-between gap-3 lg:block">
        <StatusBadge tone={monitor.tone}>{monitor.status}</StatusBadge>
        <span className="font-mono text-xs text-[#64748b] lg:hidden">{monitor.latency}</span>
      </div>
      <div className="flex items-center justify-between gap-3 lg:block">
        <CheckHistory ticks={monitor.ticks} />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b] lg:hidden">{monitor.checked}</span>
      </div>
      <span className="text-sm text-[#475569]">{monitor.interval}</span>
      <div>
        <p className="text-sm font-medium text-[#162033]">{monitor.uptime}</p>
        <p className="text-xs text-[#64748b]">{monitor.latency}</p>
      </div>
      <span className="grid size-8 place-items-center rounded-md border border-[#d8dee8] text-[#64748b]" aria-hidden="true">
        <MoreHorizontal className="size-4" />
      </span>
    </button>
  );
}

function MonitorDrawer({ monitor, drawerRef, onClose }: { monitor: Monitor; drawerRef: React.RefObject<HTMLElement | null>; onClose: () => void }): React.ReactNode {
  const responsePoints = monitor.responseTimes.length > 1 ? pointsFor(monitor.responseTimes) : null;

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
              <StatusBadge tone={monitor.tone}>{monitor.status}</StatusBadge>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9499b3]">{monitor.type}</span>
            </div>
            <h2 id="monitor-drawer-title" className="mt-3 truncate text-xl font-semibold text-[#f3f1ff]">{monitor.name}</h2>
            <p id="monitor-drawer-description" className="mt-1 truncate font-mono text-[11px] text-[#9499b3]">{monitor.url}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-md border border-[#292f4d] text-[#cfd2e5] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7165ff]" aria-label="Close monitor details">
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 px-5 py-5 sm:px-6">
          <section className="grid grid-cols-3 divide-x divide-[#292f4d] overflow-hidden rounded-md border border-[#292f4d] bg-[#101426]">
            <DrawerStat label="Current" value={monitor.latency} />
            <DrawerStat label="30d uptime" value={monitor.uptime} />
            <DrawerStat label="Interval" value={monitor.interval} />
          </section>

          <section className="rounded-md border border-[#292f4d] bg-[#101426] p-4" aria-labelledby="response-heading">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="response-heading" className="font-medium text-[#f3f1ff]">Response time</h3>
                <p className="mt-1 text-sm text-[#9499b3]">Latest checks from the last 30 minutes</p>
              </div>
              <Activity className="size-4 text-[#a79fff]" aria-hidden="true" />
            </div>
            {responsePoints ? (
              <div className="mt-5">
                <svg viewBox="0 0 300 100" className="h-28 w-full overflow-visible" role="img" aria-label="Response time trend">
                  <defs>
                    <linearGradient id="response-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7165ff" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#7165ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[25, 50, 75].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#292f4d" strokeWidth="0.7" />)}
                  <path d={`${responsePoints.area} L 300 100 L 0 100 Z`} fill="url(#response-area)" />
                  <path d={responsePoints.line} fill="none" stroke="#8b83ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={responsePoints.last.x} cy={responsePoints.last.y} r="3.5" fill="#7165ff" stroke="#d8d5ff" strokeWidth="1.5" />
                </svg>
                <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#9499b3]">
                  <span>30 min ago</span>
                  <span>Now</span>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-[#292f4d] px-3 py-7 text-center text-sm text-[#9499b3]">A response-time trend will appear after the first check.</div>
            )}
          </section>

          <section className="overflow-hidden rounded-md border border-[#292f4d] bg-[#101426]" aria-labelledby="regions-drawer-heading">
            <div className="flex items-center justify-between border-b border-[#292f4d] px-4 py-3">
              <div>
                <h3 id="regions-drawer-heading" className="font-medium text-[#f3f1ff]">Regional checks</h3>
                <p className="mt-0.5 text-sm text-[#9499b3]">Independent monitoring vantage points</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9499b3]">{monitor.regions.length} regions</span>
            </div>
            <ul className="divide-y divide-[#292f4d]">
              {monitor.regions.map((region) => (
                <li key={region.code} className="flex items-center gap-3 px-4 py-3">
                  <ToneDot tone={region.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#f3f1ff]">{region.city}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#9499b3]">{region.code}</p>
                  </div>
                  <span className="font-mono text-xs text-[#cfd2e5]">{region.latency}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-[#292f4d] bg-[#101426] p-4" aria-labelledby="alert-rule-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 id="alert-rule-heading" className="font-medium text-[#f3f1ff]">Alert rule</h3>
                <p className="mt-1 text-sm leading-5 text-[#9499b3]">Notify the workspace when two consecutive checks fail or latency crosses 500 ms.</p>
              </div>
              <span className="shrink-0 rounded-md border border-[#3b4380] bg-[#171b3c] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#aaa4ff]">Enabled</span>
            </div>
          </section>

          <button type="button" disabled title="The standalone monitor page is the next frontend route." className="mt-auto inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#292f4d] text-sm font-medium text-[#9499b3] opacity-70">
            Standalone monitor page next
            <ExternalLink className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
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

function pointsFor(values: number[]): { line: string; area: string; last: { x: number; y: number } } {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 300,
    y: 84 - ((value - minimum) / range) * 58,
  }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const area = `${line}`;
  return { line, area, last: points[points.length - 1] };
}
