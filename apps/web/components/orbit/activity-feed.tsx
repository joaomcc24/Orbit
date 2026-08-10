import { cn } from '@/lib/utils';
import { StatusBadge, ToneDot, type StatusTone } from './status-badge';

export type ActivityItem = {
  id: string;
  time: string;
  monitor: string;
  region: string;
  tone: StatusTone;
  status: string;
  detail: string;
  responseCode?: number;
};

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }): React.ReactNode {
  return (
    <section className={cn('overflow-hidden rounded-md border border-[#d8dee8] bg-white', className)} aria-labelledby="activity-heading">
      <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-4 py-3">
        <div>
          <h2 id="activity-heading" className="font-semibold text-[#162033]">Live activity</h2>
          <p className="text-sm text-[#64748b]">Recent results from your monitoring network</p>
        </div>
        <button className="shrink-0 text-sm font-medium text-[#0f766e]">View all</button>
      </div>

      <ol className="divide-y divide-[#eef2f7]">
        {items.map((item) => (
          <li key={item.id} className="grid grid-cols-[auto_1fr] gap-x-3 px-4 py-3 sm:grid-cols-[auto_5.5rem_1fr_auto] sm:items-center">
            <ToneDot tone={item.tone} className="mt-1.5 sm:mt-0" />
            <time className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">{item.time}</time>
            <div className="min-w-0">
              <p className="text-sm leading-5 text-[#475569]">
                <span className="font-medium text-[#162033]">{item.monitor}</span>{' '}
                <span>{item.detail}</span>
              </p>
              <div className="mt-1 flex items-center gap-2 sm:hidden">
                <StatusBadge tone={item.tone} className="px-1.5 py-0.5 text-[9px]">{item.status}</StatusBadge>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">{item.region}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <StatusBadge tone={item.tone} className="px-1.5 py-0.5 text-[9px]">{item.status}</StatusBadge>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">{item.region}</span>
              {item.responseCode ? <span className="font-mono text-[10px] text-[#64748b]">{item.responseCode}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
