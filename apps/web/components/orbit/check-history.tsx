import { cn } from '@/lib/utils';

export type CheckState = 'up' | 'degraded' | 'down' | 'empty';

const stateClasses: Record<CheckState, string> = {
  up: 'bg-[#22c55e]',
  degraded: 'bg-[#f59e0b]',
  down: 'bg-[#dc2626]',
  empty: 'bg-[#cbd5e1]',
};

export function CheckHistory({ ticks, className }: { ticks: CheckState[]; className?: string }): React.ReactNode {
  return (
    <div className={cn('flex h-7 items-center gap-1', className)} aria-label="Recent monitor checks">
      {ticks.map((tick, index) => (
        <span key={`${tick}-${index}`} className={cn('h-5 w-1 rounded-sm', stateClasses[tick])} />
      ))}
    </div>
  );
}
