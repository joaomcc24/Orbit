import { cn } from '@/lib/utils';
import { ToneDot, type StatusTone } from './status-badge';

export type CheckRegion = {
  code: string;
  city: string;
  label: string;
  latency: string;
  tone: StatusTone;
};

const coordinates: Record<string, { x: number; y: number }> = {
  iad: { x: 62, y: 87 },
  ams: { x: 104, y: 72 },
  sin: { x: 148, y: 102 },
};

const markerClasses: Record<StatusTone, string> = {
  success: 'fill-[#22c55e] stroke-[#86efac]',
  warning: 'fill-[#f59e0b] stroke-[#fde68a]',
  danger: 'fill-[#ef4444] stroke-[#fda4af]',
  info: 'fill-[#7165ff] stroke-[#c4b5fd]',
  neutral: 'fill-[#94a3b8] stroke-[#cbd5e1]',
  paused: 'fill-[#94a3b8] stroke-[#cbd5e1]',
};

export function RegionHealth({ regions, nextCheck, className }: { regions: CheckRegion[]; nextCheck: string; className?: string }): React.ReactNode {
  return (
    <section className={cn('overflow-hidden rounded-md border border-[#d8dee8] bg-white', className)} aria-labelledby="regions-heading">
      <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-4 py-3">
        <div>
          <h2 id="regions-heading" className="font-semibold text-[#162033]">Check regions</h2>
          <p className="text-sm text-[#64748b]">Independent vantage points</p>
        </div>
        <span className="rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">
          {regions.length} active
        </span>
      </div>

      <div className="relative overflow-hidden border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-4">
        <svg viewBox="0 0 200 150" className="mx-auto block h-32 w-full max-w-[300px]" role="img" aria-label="Monitoring locations around the globe">
          <defs>
            <radialGradient id="region-glow" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#292f4d" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#101426" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="75" r="61" fill="url(#region-glow)" stroke="#292f4d" />
          <ellipse cx="100" cy="75" rx="61" ry="18" fill="none" stroke="#292f4d" strokeWidth="0.7" />
          <ellipse cx="100" cy="75" rx="61" ry="38" fill="none" stroke="#292f4d" strokeWidth="0.7" />
          <ellipse cx="100" cy="75" rx="19" ry="61" fill="none" stroke="#292f4d" strokeWidth="0.7" />
          <ellipse cx="100" cy="75" rx="41" ry="61" fill="none" stroke="#292f4d" strokeWidth="0.7" />
          <line x1="39" y1="75" x2="161" y2="75" stroke="#292f4d" strokeWidth="0.7" />
          <line x1="100" y1="14" x2="100" y2="136" stroke="#292f4d" strokeWidth="0.7" />
          {regions.map((region) => {
            const position = coordinates[region.code.toLowerCase()] ?? { x: 100, y: 75 };
            return (
              <g key={region.code}>
                <circle cx={position.x} cy={position.y} r="5" fill="none" stroke="#7165ff" strokeOpacity="0.28" />
                <circle cx={position.x} cy={position.y} r="2.8" className={markerClasses[region.tone]} strokeWidth="1.25" />
                <text x={position.x + 7} y={position.y + 3} fill="#cfd2e5" fontSize="7" fontFamily="var(--orbit-mono)">{region.code.toUpperCase()}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="divide-y divide-[#eef2f7]">
        {regions.map((region) => (
          <li key={region.code} className="flex items-center gap-3 px-4 py-3">
            <ToneDot tone={region.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#162033]">{region.city}</p>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">{region.code} · {region.label}</p>
            </div>
            <span className="font-mono text-xs font-medium text-[#162033]">{region.latency}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#64748b]">
        <span>Next check</span>
        <span className="font-medium text-[#162033]">{nextCheck}</span>
      </div>
    </section>
  );
}
