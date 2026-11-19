import type { GanttSlice } from '@os-lab/engine';
import { cn, colorFor } from '@/lib/utils';

/**
 * Gantt chart. When `upTo` is given, only the part executed before that time is
 * drawn (used by the visual simulator as it plays).
 */
export function GanttChart({ gantt, ids, upTo, tone = 'light', total }: { gantt: GanttSlice[]; ids: string[]; upTo?: number; tone?: 'light' | 'lab'; total?: number }) {
  const end = total ?? gantt[gantt.length - 1]?.end ?? 0;
  const start = gantt[0]?.start ?? 0;
  const span = Math.max(1, end - start);
  const cutoff = upTo ?? end;
  const visible = gantt.filter((g) => g.start < cutoff).map((g) => ({ ...g, end: Math.min(g.end, cutoff) }));
  const ticks = Array.from(new Set([start, ...gantt.map((g) => g.end)]));
  const lab = tone === 'lab';

  return (
    <div className="w-full overflow-x-auto px-3 pb-1">
      <div className="relative" style={{ minWidth: Math.max(320, span * 26) }}>
        <div className={cn('relative h-11 rounded-lg', lab ? 'bg-lab/80 ring-1 ring-lab-line' : 'bg-ink/[0.05] ring-1 ring-line')}>
          {visible.map((g, i) => {
            const left = ((g.start - start) / span) * 100;
            const width = ((g.end - g.start) / span) * 100;
            const color = colorFor(g.pid, ids);
            return (
              <div
                key={`${g.pid}-${g.start}-${i}`}
                className={cn(
                  'absolute top-0 flex h-11 items-center justify-center overflow-hidden border-r font-mono text-[12px] font-semibold transition-[width] duration-300',
                  lab ? 'border-lab' : 'border-surface',
                  g.pid === null && (lab ? 'text-lab-dim' : 'text-faint'),
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: g.pid
                    ? color
                    : `repeating-linear-gradient(135deg, transparent 0 5px, ${lab ? 'rgb(255 255 255/0.06)' : 'rgb(127 127 127/0.16)'} 5px 10px)`,
                  color: g.pid ? '#141413' : undefined,
                  borderRadius: i === 0 ? '8px 0 0 8px' : undefined,
                }}
                title={`${g.pid ?? 'Idle'}: ${g.start} → ${g.end}`}
              >
                {g.pid ?? 'idle'}
              </div>
            );
          })}
        </div>
        <div className="relative mt-1 h-4">
          {ticks.map((t) => (
            <span
              key={t}
              className={cn('absolute -translate-x-1/2 font-mono text-[10.5px] tabular', lab ? 'text-lab-dim' : 'text-muted', t > cutoff && 'opacity-0')}
              style={{ left: `${((t - start) / span) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
