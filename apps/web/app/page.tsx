import {
  Activity,
  Bell,
  CircleCheck,
  Clock3,
  Gauge,
  Globe2,
  Plus,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Activity },
  { label: 'Status pages', icon: Globe2 },
  { label: 'Alerts', icon: Bell },
  { label: 'Settings', icon: Settings },
];

const monitors = [
  {
    name: 'API health',
    url: 'http://localhost:3001/api/health',
    status: 'Operational',
    uptime: '100%',
    latency: '82 ms',
  },
  {
    name: 'Marketing site',
    url: 'https://orbit.local',
    status: 'Operational',
    uptime: '99.99%',
    latency: '141 ms',
  },
  {
    name: 'Billing webhook',
    url: 'https://api.orbit.local/webhooks/stripe',
    status: 'Watching',
    uptime: '99.95%',
    latency: '216 ms',
  },
];

export default function Home(): React.ReactNode {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-border bg-muted/40 px-4 py-5 md:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Gauge className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold leading-none">Orbit</p>
              <p className="mt-1 text-sm text-muted-foreground">Monitor ops</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Current workspace health at a glance</p>
            </div>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
              <Plus className="size-4" aria-hidden="true" />
              New monitor
            </button>
          </header>

          <div className="grid gap-4 px-4 py-5 sm:grid-cols-3 sm:px-6">
            <Metric label="Operational monitors" value="3" icon={CircleCheck} />
            <Metric label="Average latency" value="146 ms" icon={Clock3} />
            <Metric label="Incidents open" value="0" icon={Bell} />
          </div>

          <div className="px-4 pb-8 sm:px-6">
            <div className="overflow-hidden rounded-md border border-border">
              <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr] border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground sm:grid">
                <span>Monitor</span>
                <span>Status</span>
                <span>Uptime</span>
                <span>Latency</span>
              </div>

              {monitors.map((monitor) => (
                <div
                  key={monitor.name}
                  className="grid grid-cols-1 gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{monitor.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{monitor.url}</p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-md bg-success/10 px-2 py-1 text-sm font-medium text-success">
                    {monitor.status}
                  </span>
                  <span className="text-sm font-medium">{monitor.uptime}</span>
                  <span className="text-sm text-muted-foreground">{monitor.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}): React.ReactNode {
  return (
    <div className="rounded-md border border-border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" aria-hidden={true} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
