import { ToneDot, type StatusTone } from './status-badge';

export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
}): React.ReactNode {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
        <ToneDot tone={tone} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#162033]">{value}</p>
      <p className="mt-1 text-sm text-[#64748b]">{detail}</p>
    </section>
  );
}
