import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'paused';

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-[#ecfdf3] text-[#15803d] ring-[#bbf7d0]',
  warning: 'bg-[#fffbeb] text-[#b45309] ring-[#fde68a]',
  danger: 'bg-[#fef2f2] text-[#dc2626] ring-[#fecaca]',
  info: 'bg-[#eff6ff] text-[#2563eb] ring-[#bfdbfe]',
  neutral: 'bg-[#f8fafc] text-[#475569] ring-[#d8dee8]',
  paused: 'bg-[#f1f5f9] text-[#64748b] ring-[#d8dee8]',
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}): React.ReactNode {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ring-1',
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function ToneDot({ tone, className }: { tone: StatusTone; className?: string }): React.ReactNode {
  const classes: Record<StatusTone, string> = {
    success: 'bg-[#22c55e]',
    warning: 'bg-[#f59e0b]',
    danger: 'bg-[#dc2626]',
    info: 'bg-[#2563eb]',
    neutral: 'bg-[#94a3b8]',
    paused: 'bg-[#94a3b8]',
  };

  return <span className={cn('size-2 rounded-full', classes[tone], className)} />;
}
