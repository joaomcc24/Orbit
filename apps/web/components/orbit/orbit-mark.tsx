import { cn } from '@/lib/utils';

export function OrbitMark({
  activityTick = 0,
  className,
}: {
  /** Increment when a fresh monitor result arrives; the orbit advances one step. */
  activityTick?: number;
  className?: string;
}): React.ReactNode {
  return (
    <span className={cn('relative grid size-9 shrink-0 place-items-center', className)} aria-label="Orbit">
      <span className="absolute inset-0 rounded-full border border-[#292f4d]" />
      <span
        className="absolute inset-1 rounded-full border border-transparent border-r-[#7165ff] border-t-[#7165ff] transition-[transform,box-shadow] duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
        style={{ transform: `rotate(${activityTick * 30}deg)` }}
      />
      <span className="size-1.5 rounded-full bg-[#7165ff] shadow-[0_0_12px_rgb(113_101_255_/_0.5)]" />
    </span>
  );
}
