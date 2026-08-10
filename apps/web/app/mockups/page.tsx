import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Command,
  Gauge,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Pause,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  CheckHistory,
  MetricCard,
  OrbitMark,
  StatusBadge,
  type CheckState,
  type StatusTone as Tone,
} from '@/components/orbit';

type Monitor = {
  name: string;
  url: string;
  status: string;
  tone: Tone;
  interval: string;
  checked: string;
  uptime: string;
  latency: string;
  regions: Array<{ code: string; latency: string; tone: Tone; width: number }>;
  ticks: CheckState[];
};

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Monitors', icon: Activity, active: false },
  { label: 'Incidents', icon: AlertTriangle, active: false, count: '2' },
  { label: 'Status pages', icon: Globe2, active: false },
  { label: 'Team', icon: Users, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

const metrics = [
  { label: 'Currently down', value: '1', detail: 'API Gateway - EU edge', tone: 'danger' as Tone },
  { label: 'Degraded', value: '2', detail: 'Webhooks and dashboard', tone: 'warning' as Tone },
  { label: '30d uptime', value: '99.94%', detail: 'Across 12 live monitors', tone: 'success' as Tone },
  { label: 'Median latency', value: '148 ms', detail: 'Last 24 hours', tone: 'info' as Tone },
];

const monitors: Monitor[] = [
  {
    name: 'API Gateway',
    url: 'https://api.acmecloud.com/health',
    status: 'Down',
    tone: 'danger',
    interval: '30s',
    checked: '18 sec ago',
    uptime: '99.91%',
    latency: 'No response',
    regions: [
      { code: 'EU', latency: 'timeout', tone: 'danger', width: 100 },
      { code: 'US', latency: '144 ms', tone: 'success', width: 36 },
      { code: 'APAC', latency: '201 ms', tone: 'success', width: 50 },
    ],
    ticks: ['up', 'up', 'up', 'up', 'degraded', 'up', 'up', 'up', 'degraded', 'down', 'down', 'down'],
  },
  {
    name: 'Web App',
    url: 'https://app.acmecloud.com',
    status: 'Operational',
    tone: 'success',
    interval: '60s',
    checked: '21 sec ago',
    uptime: '99.99%',
    latency: '121 ms',
    regions: [
      { code: 'EU', latency: '98 ms', tone: 'success', width: 26 },
      { code: 'US', latency: '121 ms', tone: 'success', width: 32 },
      { code: 'APAC', latency: '178 ms', tone: 'success', width: 44 },
    ],
    ticks: ['up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up'],
  },
  {
    name: 'Billing Webhooks',
    url: 'https://api.acmecloud.com/webhooks/stripe',
    status: 'Degraded',
    tone: 'warning',
    interval: '60s',
    checked: '29 sec ago',
    uptime: '99.95%',
    latency: '812 ms',
    regions: [
      { code: 'EU', latency: '284 ms', tone: 'success', width: 42 },
      { code: 'US', latency: '812 ms', tone: 'warning', width: 84 },
      { code: 'APAC', latency: '333 ms', tone: 'success', width: 48 },
    ],
    ticks: ['up', 'up', 'up', 'degraded', 'up', 'up', 'degraded', 'up', 'up', 'degraded', 'degraded', 'up'],
  },
  {
    name: 'Documentation',
    url: 'https://docs.acmecloud.com',
    status: 'Operational',
    tone: 'success',
    interval: '5m',
    checked: '44 sec ago',
    uptime: '100%',
    latency: '96 ms',
    regions: [
      { code: 'EU', latency: '82 ms', tone: 'success', width: 22 },
      { code: 'US', latency: '96 ms', tone: 'success', width: 28 },
      { code: 'APAC', latency: '151 ms', tone: 'success', width: 38 },
    ],
    ticks: ['up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up'],
  },
  {
    name: 'Status Page',
    url: 'https://status.acmecloud.com',
    status: 'Operational',
    tone: 'success',
    interval: '60s',
    checked: '51 sec ago',
    uptime: '99.98%',
    latency: '133 ms',
    regions: [
      { code: 'EU', latency: '109 ms', tone: 'success', width: 30 },
      { code: 'US', latency: '133 ms', tone: 'success', width: 34 },
      { code: 'APAC', latency: '196 ms', tone: 'success', width: 48 },
    ],
    ticks: ['up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up'],
  },
];

const recentChecks = [
  { time: '16:41:22', region: 'EU', status: 'Down', code: 'timeout', latency: '30s', tone: 'danger' as Tone },
  { time: '16:40:52', region: 'US', status: 'Up', code: '200', latency: '144 ms', tone: 'success' as Tone },
  { time: '16:40:51', region: 'APAC', status: 'Up', code: '200', latency: '201 ms', tone: 'success' as Tone },
  { time: '16:40:22', region: 'EU', status: 'Down', code: '502', latency: '2.4s', tone: 'danger' as Tone },
  { time: '16:39:52', region: 'US', status: 'Up', code: '200', latency: '139 ms', tone: 'success' as Tone },
];

const incidentTimeline = [
  { time: '16:43', title: 'Investigation started', body: 'On-call is checking EU edge routing and upstream health.', type: 'Internal note', tone: 'danger' as Tone },
  { time: '16:39', title: 'Alert threshold crossed', body: 'API Gateway failed 3 consecutive checks from EU.', type: 'Automated alert', tone: 'warning' as Tone },
  { time: '16:37', title: 'Latency spike detected', body: 'EU response time exceeded 2 seconds before hard failures.', type: 'Signal detected', tone: 'info' as Tone },
];

export default function MockupsPage(): React.ReactNode {
  return (
    <main className="orbit-console min-h-screen bg-[#080b16] text-[#f3f1ff]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Topbar />

          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
            <IncidentBar />

            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <section className="min-w-0 space-y-5">
                <HeaderBlock />
                <MetricStrip />
                <MonitorTable />
              </section>

              <MonitorDetailPanel />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IncidentTimeline />
              <StatusPagePreview />
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <CreateMonitorFlow />
              <TeamAndSecurity />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar(): React.ReactNode {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[#d8dee8] bg-[#101827]/60 px-3 py-4 text-white backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-5 flex items-center gap-3 px-2">
        <OrbitMark />
        <div className="min-w-0">
          <p className="font-serif text-[22px] italic leading-none">Orbit</p>
          <p className="mt-1 text-sm text-[#94a3b8]">Monitor operations</p>
        </div>
      </div>

      <button className="mb-5 flex h-11 w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 text-left">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">Acme Cloud</span>
          <span className="block truncate text-xs text-[#94a3b8]">Pro plan - 12 monitors</span>
        </span>
        <ChevronDown className="size-4 text-[#94a3b8]" aria-hidden="true" />
      </button>

      <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Workspace</p>
      <nav className="space-y-1">
        {navItems.slice(0, 4).map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${
              item.active
                ? 'bg-[#0f766e] text-white shadow-sm'
                : 'text-[#cbd5e1] hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count ? (
              <span className="rounded-md bg-[#dc2626] px-1.5 py-0.5 text-xs text-white">{item.count}</span>
            ) : null}
          </a>
        ))}
      </nav>

      <p className="mt-4 px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Account</p>
      <nav className="space-y-1">
        {navItems.slice(4).map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${
              item.active
                ? 'bg-[#0f766e] text-white shadow-sm'
                : 'text-[#cbd5e1] hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count ? (
              <span className="rounded-md bg-[#dc2626] px-1.5 py-0.5 text-xs text-white">{item.count}</span>
            ) : null}
          </a>
        ))}
      </nav>

      <div className="mt-8 rounded-md border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-[#2dd4bf]" aria-hidden="true" />
          Security posture
        </div>
        <p className="mt-2 text-sm leading-5 text-[#94a3b8]">
          2FA enforced, audit log active, signed webhooks enabled.
        </p>
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-xs text-[#94a3b8]">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#22c55e]" />
            API online
          </span>
          <span>30s</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar(): React.ReactNode {
  return (
    <header className="sticky top-0 z-20 border-b border-[#d8dee8] bg-white/95 px-4 py-3 sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#64748b]">Acme Cloud / Production</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#162033]">Service health</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-[#d8dee8] bg-[#f8fafc] px-3 text-sm text-[#64748b] sm:w-80">
            <Search className="size-4" aria-hidden="true" />
            <span className="truncate">Search monitors, incidents, teams</span>
            <kbd className="ml-auto hidden rounded-md border border-[#d8dee8] bg-white px-1.5 py-0.5 text-xs sm:inline-flex">
              <Command className="mr-1 size-3" aria-hidden="true" />K
            </kbd>
          </label>
          <IconButton label="Notifications" icon={Bell} />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white shadow-sm">
            <Plus className="size-4" aria-hidden="true" />
            New monitor
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderBlock(): React.ReactNode {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white p-4">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="danger">1 down</StatusBadge>
            <StatusBadge tone="warning">2 degraded</StatusBadge>
            <StatusBadge tone="success">9 operational</StatusBadge>
          </div>
          <h2 className="max-w-3xl font-serif text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-[#f3f1ff] sm:text-4xl">
            <span className="text-[#fb7185]">1</span> monitor down, <span className="text-[#fbbf24]">2</span> degraded.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
            The EU API edge is failing checks; core application remains available in US and APAC.
            Orbit keeps the active operational question and the next communication step together.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-3 gap-2 rounded-md border border-[#d8dee8] bg-[#f8fafc] p-2">
          <MiniStat label="Last check" value="16:43:12" />
          <MiniStat label="Regions" value="3" />
          <MiniStat label="Open inc." value="2" />
        </div>
      </div>
    </section>
  );
}

function IncidentBar(): React.ReactNode {
  return (
    <section className="rounded-md border border-l-2 border-[#fed7aa] border-l-[#fb7185] bg-[#fff7ed] px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-[#fed7aa] text-[#9a3412]">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[#162033]">Major incident active: elevated API errors in EU</p>
            <p className="mt-1 text-sm text-[#64748b]">
              38 failed checks across 2 monitors. Last public update posted 4 minutes ago.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-9 rounded-md border border-[#fdba74] bg-white px-3 text-sm font-semibold text-[#9a3412]">
            Open incident
          </button>
          <button className="h-9 rounded-md bg-[#9a3412] px-3 text-sm font-semibold text-white">
            Post update
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricStrip(): React.ReactNode {
  return (
    <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}

function MonitorTable(): React.ReactNode {
  return (
    <section className="overflow-hidden rounded-md border border-[#d8dee8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[#162033]">Live monitors <span className="ml-1.5 align-middle font-mono text-xs font-normal text-[#64748b]">12</span></h2>
          <p className="text-sm text-[#64748b]">Service state, response time, and the last 12 checks</p>
        </div>
        <div className="flex gap-2">
          {['All 12', 'Down 1', 'Degraded 2'].map((tab, index) => (
            <button
              key={tab}
              className={`h-8 whitespace-nowrap rounded-md px-3 text-sm font-medium ${
                index === 0 ? 'bg-[#0f766e] text-white' : 'border border-[#d8dee8] text-[#475569]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-[1.35fr_0.8fr_1.15fr_1fr_0.6fr_0.7fr_0.4fr] border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-xs font-semibold uppercase text-[#64748b] 2xl:grid">
        <span>Monitor</span>
        <span>Status</span>
        <span>Regional latency</span>
        <span>Last checks</span>
        <span>Interval</span>
        <span>Uptime</span>
        <span />
      </div>

      <div className="divide-y divide-[#eef2f7] 2xl:hidden">
        {monitors.map((monitor) => <CompactMonitorRow key={monitor.name} monitor={monitor} />)}
      </div>

      {monitors.map((monitor) => (
        <div
          key={monitor.name}
          className="hidden gap-3 border-b border-[#eef2f7] px-4 py-4 last:border-b-0 2xl:grid 2xl:grid-cols-[1.35fr_0.8fr_1.15fr_1fr_0.6fr_0.7fr_0.4fr] 2xl:items-center"
        >
          <div className="min-w-0">
            <p className="font-medium text-[#162033]">{monitor.name}</p>
            <p className="truncate text-sm text-[#64748b]">{monitor.url}</p>
          </div>
          <StatusBadge tone={monitor.tone}>{monitor.status}</StatusBadge>
          <RegionLatency regions={monitor.regions} />
          <CheckHistory ticks={monitor.ticks} />
          <span className="text-sm text-[#475569]">{monitor.interval}</span>
          <div>
            <p className="text-sm font-medium text-[#162033]">{monitor.uptime}</p>
            <p className="text-xs text-[#64748b]">{monitor.latency}</p>
          </div>
          <button className="grid size-8 place-items-center rounded-md border border-[#d8dee8] text-[#64748b]">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </section>
  );
}

function CompactMonitorRow({ monitor }: { monitor: Monitor }): React.ReactNode {
  const accent = monitor.tone === 'danger' ? 'border-l-[#fb7185]' : monitor.tone === 'warning' ? 'border-l-[#fbbf24]' : 'border-l-transparent';

  return (
    <article className={`border-l-2 ${accent} px-4 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#162033]">{monitor.name}</p>
          <p className="mt-0.5 truncate text-sm text-[#64748b]">{monitor.url}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge tone={monitor.tone}>{monitor.status}</StatusBadge>
          <span className="font-mono text-xs text-[#64748b]">{monitor.latency}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <CheckHistory ticks={monitor.ticks} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{monitor.checked}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-[#e2e8f0] rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
        <CompactDatum label="Uptime" value={monitor.uptime} />
        <CompactDatum label="Interval" value={monitor.interval} />
        <CompactDatum label="Regions" value={`${monitor.regions.length} active`} />
      </div>
    </article>
  );
}

function CompactDatum({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="min-w-0 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#162033]">{value}</p>
    </div>
  );
}

function MonitorDetailPanel(): React.ReactNode {
  return (
    <aside className="rounded-md border border-l-2 border-[#d8dee8] border-l-[#fb7185] bg-white">
      <div className="border-b border-[#e2e8f0] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone="danger">Down</StatusBadge>
              <span className="rounded-md border border-[#d8dee8] px-2 py-1 text-xs font-medium text-[#475569]">HTTP</span>
              <span className="rounded-md border border-[#d8dee8] px-2 py-1 text-xs font-medium text-[#475569]">30s</span>
            </div>
            <h2 className="text-lg font-semibold text-[#162033]">API Gateway</h2>
            <p className="mt-1 truncate text-sm text-[#64748b]">https://api.acmecloud.com/health</p>
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8dee8] px-3 text-sm font-medium text-[#475569]">
            <Pause className="size-4" aria-hidden="true" />
            Pause
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[#e2e8f0] p-4">
        <MiniStat label="24h" value="98.42%" tone="danger" />
        <MiniStat label="7d" value="99.91%" />
        <MiniStat label="30d" value="99.96%" />
      </div>

      <div className="border-b border-[#e2e8f0] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#162033]">Response time</p>
          <p className="text-sm text-[#64748b]">Last 6h</p>
        </div>
        <LatencyChart />
      </div>

      <div className="border-b border-[#e2e8f0] p-4">
        <p className="mb-3 text-sm font-semibold text-[#162033]">Region health</p>
        <div className="space-y-2">
          <RegionHealth region="EU" status="Down" detail="timeout" tone="danger" />
          <RegionHealth region="US" status="Up" detail="144 ms" tone="success" />
          <RegionHealth region="APAC" status="Up" detail="201 ms" tone="success" />
        </div>
      </div>

      <div className="p-4">
        <p className="mb-3 text-sm font-semibold text-[#162033]">Recent checks</p>
        <div className="overflow-hidden rounded-md border border-[#e2e8f0]">
          <div className="grid grid-cols-[0.75fr_0.6fr_0.7fr_0.75fr] border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">
            <span>Time</span>
            <span>Region</span>
            <span>Code</span>
            <span className="text-right">Latency</span>
          </div>
          {recentChecks.map((check) => (
            <div key={`${check.time}-${check.region}`} className="grid grid-cols-[0.75fr_0.6fr_0.7fr_0.75fr] border-b border-[#eef2f7] px-3 py-2 font-mono text-xs last:border-b-0">
              <span className="text-[#64748b]">{check.time}</span>
              <span className="font-medium text-[#162033]">{check.region}</span>
              <span className={check.tone === 'danger' ? 'font-medium text-[#dc2626]' : 'text-[#15803d]'}>{check.code}</span>
              <span className="text-right text-[#475569]">{check.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function IncidentTimeline(): React.ReactNode {
  const states = [
    { label: 'Investigating', detail: 'Active now' },
    { label: 'Identified', detail: 'Cause confirmed' },
    { label: 'Monitoring', detail: 'Fix observed' },
    { label: 'Resolved', detail: 'Incident closed' },
  ];

  return (
    <section className="rounded-md border border-[#d8dee8] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#162033]">Incident console</h2>
          <p className="text-sm text-[#64748b]">Internal investigation and public communication</p>
        </div>
        <span className="shrink-0 rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">INC-2178</span>
      </div>
      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {states.map((state, index) => (
            <div key={state.label} className={`rounded-md border px-3 py-2 ${index === 0 ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]' : 'border-[#d8dee8] bg-[#f8fafc] text-[#64748b]'}`}>
              <div className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${index === 0 ? 'bg-[#fb7185]' : 'bg-[#64748b]'}`} />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">{state.label}</p>
              </div>
              <p className="mt-1.5 text-xs">{state.detail}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-3 divide-x divide-[#e2e8f0] overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
          <IncidentDatum label="Impact" value="EU only" detail="US, APAC healthy" />
          <IncidentDatum label="Affected" value="2 monitors" detail="38 failed checks" />
          <IncidentDatum label="Last update" value="4 min ago" detail="Public status page" />
        </div>

        <div className="space-y-3">
          {incidentTimeline.map((item) => (
            <div key={item.time} className="grid grid-cols-[52px_1fr] gap-3">
              <span className="pt-1 font-mono text-xs text-[#64748b]">{item.time}</span>
              <div className="relative rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <span className={`absolute left-0 top-3 size-1.5 -translate-x-1/2 rounded-full ${item.tone === 'danger' ? 'bg-[#fb7185]' : item.tone === 'warning' ? 'bg-[#fbbf24]' : 'bg-[#7165ff]'}`} />
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="font-medium text-[#162033]">{item.title}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">{item.type}</span>
                </div>
                <p className="mt-1 text-sm text-[#64748b]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-[#d8dee8] bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#162033]">Public update draft</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">status.acmecloud.com</span>
          </div>
          <p className="mt-2 rounded-md border border-[#e2e8f0] bg-white p-3 text-sm leading-6 text-[#64748b]">
            We are investigating elevated API error rates affecting requests from the EU region. US and APAC regions remain operational.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Visible to subscribers</span>
            <div className="flex gap-2">
              <button className="h-9 rounded-md border border-[#d8dee8] px-3 text-sm font-medium text-[#475569]">Save draft</button>
              <button className="h-9 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white">Post update</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IncidentDatum({ label, value, detail }: { label: string; value: string; detail: string }): React.ReactNode {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#162033]">{value}</p>
      <p className="mt-0.5 truncate text-xs text-[#64748b]">{detail}</p>
    </div>
  );
}

function StatusPagePreview(): React.ReactNode {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#162033]">Public status page</h2>
          <p className="text-sm text-[#64748b]">The calmer, customer-facing side of an incident</p>
        </div>
        <span className="shrink-0 rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">Preview</span>
      </div>
      <div className="p-4">
        <div className="overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-6 place-items-center rounded-md bg-[#0f766e]">
                <span className="size-2 rounded-full border border-white/70" />
              </div>
              <p className="font-semibold text-[#162033]">Acme Cloud status</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">status.acmecloud.com</span>
          </div>

          <div className="border-l-2 border-[#fb7185] bg-[#fef2f2] p-4">
            <div className="flex gap-3">
              <XCircle className="mt-0.5 size-5 shrink-0 text-[#dc2626]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold text-[#162033]">Investigating elevated API errors in EU</p>
                <p className="mt-1 text-sm leading-5 text-[#64748b]">We are investigating an issue affecting API requests from the EU region.</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Updated 4 minutes ago</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">Services</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Last checked now</span>
            </div>
            <div className="divide-y divide-[#e2e8f0] rounded-md border border-[#e2e8f0] bg-white">
              {monitors.slice(0, 4).map((monitor) => (
                <div key={monitor.name} className="flex items-center justify-between gap-3 px-3 py-3">
                  <span className="font-medium text-[#162033]">{monitor.name}</span>
                  <StatusBadge tone={monitor.tone}>{monitor.status}</StatusBadge>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-[#e2e8f0] bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#162033]">Incident updates</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">1 active</span>
              </div>
              <div className="mt-3 space-y-2 border-l border-[#e2e8f0] pl-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">16:43 · Investigating</p>
                  <p className="mt-1 text-sm text-[#64748b]">Our team is investigating the EU routing path.</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">16:39 · Identified</p>
                  <p className="mt-1 text-sm text-[#64748b]">Errors are isolated to the EU edge; other regions remain operational.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[#e2e8f0] pt-4">
              <p className="text-sm font-medium text-[#162033]">Get status updates</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input className="h-10 min-w-0 flex-1 rounded-md border border-[#d8dee8] bg-white px-3 text-sm text-[#162033] placeholder:text-[#64748b]" placeholder="you@example.com" />
                <button className="h-10 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreateMonitorFlow(): React.ReactNode {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="size-5 text-[#0f766e]" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-[#162033]">Create monitor</h2>
            <p className="text-sm text-[#64748b]">Safe defaults for a production HTTP check</p>
          </div>
        </div>
        <span className="rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">HTTP</span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">1 · Endpoint</p>
          <Field label="URL" value="https://api.acmecloud.com/health" />
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
            <Field label="Display name" value="API Gateway" />
            <Field label="Method" value="GET" />
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">2 · Check policy</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Interval" value="30 seconds" />
            <Field label="Timeout" value="10 seconds" />
            <Field label="Expected" value="200 OK" />
          </div>
        </div>

        <div className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1d4ed8]">3 · Alert policy</p>
          <p className="mt-1 text-sm leading-5 text-[#1d4ed8]">Checked from EU, US, and APAC. Alert the on-call team after 2 consecutive failures.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">3 regions · 30s interval</span>
          <button className="h-9 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white">Create monitor</button>
        </div>
      </div>
    </section>
  );
}

function TeamAndSecurity(): React.ReactNode {
  const members = [
    { name: 'Joao Cardoso', role: 'Owner', email: 'joao@acmecloud.com' },
    { name: 'Ana Martins', role: 'Admin', email: 'ana@acmecloud.com' },
    { name: 'Miguel Silva', role: 'Viewer', email: 'miguel@acmecloud.com' },
  ];

  return (
    <section className="rounded-md border border-[#d8dee8] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#162033]">Team and security</h2>
          <p className="text-sm text-[#64748b]">People, permissions, and workspace controls</p>
        </div>
        <button className="h-8 shrink-0 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white">Invite member</button>
      </div>
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="divide-y divide-[#eef2f7] rounded-md border border-[#e2e8f0]">
          {members.map((member) => (
            <div key={member.email} className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_64px_auto] sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eff6ff] font-mono text-[10px] font-semibold text-[#1d4ed8]">{member.name.split(' ').map((part) => part[0]).join('')}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#162033]">{member.name}</p>
                  <p className="truncate text-sm text-[#64748b]">{member.email}</p>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Active today</p>
              <span className="w-fit rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#475569]">{member.role}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-[#d8dee8] bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-2 font-semibold text-[#162033]">
            <span className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-[#0f766e]" aria-hidden="true" />
            Access rules
            </span>
            <span className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-[#64748b]">Healthy</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[#64748b]">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-[#15803d]" aria-hidden="true" />Owners manage billing and deletion.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-[#15803d]" aria-hidden="true" />Admins create monitors and incidents.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-[#15803d]" aria-hidden="true" />Viewers can inspect status only.</li>
          </ul>
          <div className="mt-4 border-t border-[#e2e8f0] pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">Last audit</p>
            <p className="mt-1 text-sm font-medium text-[#162033]">No outstanding access changes</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#475569]">{label}</span>
      <span className="flex h-10 items-center rounded-md border border-[#d8dee8] bg-[#f8fafc] px-3 text-sm text-[#162033]">{value}</span>
    </label>
  );
}

function IconButton({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }): React.ReactNode {
  return (
    <button className="grid size-10 place-items-center rounded-md border border-[#d8dee8] bg-white text-[#475569]" aria-label={label}>
      <Icon className="size-4" aria-hidden={true} />
    </button>
  );
}

function MiniStat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: Tone }): React.ReactNode {
  const toneClass = tone === 'danger' ? 'text-[#dc2626]' : 'text-[#162033]';

  return (
    <div className="rounded-md border border-[#e2e8f0] bg-white px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function RegionLatency({ regions }: { regions: Monitor['regions'] }): React.ReactNode {
  return (
    <div className="space-y-1.5">
      {regions.map((region) => (
        <div key={region.code} className="grid grid-cols-[34px_1fr_58px] items-center gap-2 text-xs">
          <span className="font-medium text-[#475569]">{region.code}</span>
          <span className="h-1.5 overflow-hidden rounded-sm bg-[#e2e8f0]">
            <span
              className={`block h-full rounded-sm ${
                region.tone === 'danger'
                  ? 'bg-[#dc2626]'
                  : region.tone === 'warning'
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#22c55e]'
              }`}
              style={{ width: `${region.width}%` }}
            />
          </span>
          <span className="text-right text-[#64748b]">{region.latency}</span>
        </div>
      ))}
    </div>
  );
}

function LatencyChart(): React.ReactNode {
  const bars = [22, 24, 21, 27, 29, 35, 31, 42, 38, 58, 96, 82, 71, 44, 33, 28];

  return (
    <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <div className="relative flex h-32 items-end gap-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          <span className="border-t border-[#e2e8f0]" />
          <span className="border-t border-[#e2e8f0]" />
          <span className="border-t border-[#e2e8f0]" />
          <span className="border-t border-[#e2e8f0]" />
        </div>
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className={`relative z-10 flex-1 rounded-sm ${height > 80 ? 'bg-[#dc2626]' : height > 50 ? 'bg-[#f59e0b]' : 'bg-[#0f766e]'}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748b]">
        <span>6h ago</span>
        <span>EU edge</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function RegionHealth({ region, status, detail, tone }: { region: string; status: string; detail: string; tone: Tone }): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#e2e8f0] px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <CircleDot className={`size-4 ${tone === 'danger' ? 'text-[#dc2626]' : 'text-[#22c55e]'}`} aria-hidden="true" />
        <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#162033]">{region}</span>
      </div>
      <span className="text-[#64748b]">{status} - {detail}</span>
    </div>
  );
}
