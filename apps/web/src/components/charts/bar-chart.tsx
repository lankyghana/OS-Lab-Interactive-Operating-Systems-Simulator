import { cn, fmt } from '@/lib/utils';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

/**
 * Horizontal bar chart for comparing algorithms. Direct labels on every bar,
 * best value highlighted, no legend needed.
 */
export function BarChart({ data, unit, lowerIsBetter = true, className }: { data: BarDatum[]; unit?: string; lowerIsBetter?: boolean; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const best = lowerIsBetter ? Math.min(...data.map((d) => d.value)) : Math.max(...data.map((d) => d.value));
  return (
    <div className={cn('flex flex-col gap-2', className)} role="img" aria-label={data.map((d) => `${d.label}: ${fmt(d.value)}${unit ? ' ' + unit : ''}`).join(', ')}>
      {data.map((d) => {
        const isBest = d.value === best;
        return (
          <div key={d.label} className="grid grid-cols-[minmax(84px,140px)_1fr] items-center gap-3">
            <span className="truncate text-[13px] font-medium text-muted" title={d.label}>
              {d.label}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-6 flex-1 rounded-md bg-ink/[0.05]">
                <div
                  className={cn('h-6 rounded-md transition-all duration-700', isBest ? 'bg-ok' : d.highlight ? 'bg-brand' : 'bg-ink/25')}
                  style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
                />
              </div>
              <span className={cn('w-16 text-right text-[13px] font-semibold tabular', isBest && 'text-ok')}>
                {fmt(d.value)}
                {unit && <span className="ml-0.5 text-[11px] font-normal text-muted">{unit}</span>}
              </span>
            </div>
          </div>
        );
      })}
      <p className="mt-1 text-[11px] text-muted">
        <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-ok align-middle" /> Best result ({lowerIsBetter ? 'lowest' : 'highest'})
      </p>
    </div>
  );
}

/** Simple line chart (SVG) used for the frames-vs-faults sweep. */
export function LineChart({
  series,
  xLabels,
  height = 220,
  yLabel,
}: {
  series: { name: string; color: string; values: number[] }[];
  xLabels: string[];
  height?: number;
  yLabel?: string;
}) {
  const W = 600;
  const H = height;
  const pad = { l: 40, r: 90, t: 12, b: 30 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, xLabels.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = Array.from(new Set(Array.from({ length: 5 }, (_, i) => Math.round((max * i) / 4))));
  // End-of-line labels: keep at least 15px apart so equal values don't overlap.
  const labelY = new Map<string, number>();
  [...series]
    .map((s) => ({ name: s.name, y: y(s.values[s.values.length - 1]) }))
    .sort((a, b) => a.y - b.y)
    .forEach((l, i, arr) => {
      const prev = i > 0 ? labelY.get(arr[i - 1].name)! : -Infinity;
      labelY.set(l.name, Math.max(l.y, prev + 15));
    });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={yLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--faint)">
            {t}
          </text>
        </g>
      ))}
      {xLabels.map((l, i) => (
        <text key={l} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">
          {l}
        </text>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--surface)" stroke={s.color} strokeWidth="2">
              <title>{`${s.name}, ${xLabels[i]}: ${v}`}</title>
            </circle>
          ))}
          <text x={x(s.values.length - 1) + 10} y={labelY.get(s.name)! + 4} fontSize="12" fontWeight="600" fill={s.color}>
            {s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
