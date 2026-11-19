import { useMemo, type ReactNode } from 'react';
import {
  allocateMemory,
  replacePages,
  scheduleCpu,
  scheduleDisk,
  type CpuAlgorithm,
  type DiskAlgorithm,
  type FitAlgorithm,
  type PageAlgorithm,
} from '@os-lab/engine';
import { PROCESS_COLORS } from '@/lib/utils';
import type { ModuleId } from '@/lib/progress';

/**
 * "Plates": gallery pictures drawn from real engine output, so each algorithm's card
 * shows what that algorithm actually does with the same input. All plates share a
 * 300×400 canvas and use `slice` so they fill any card aspect ratio.
 */

export const MODULE_TONE: Record<ModuleId | 'practice', string> = {
  process: 'var(--plate-process)',
  cpu: 'var(--plate-cpu)',
  memory: 'var(--plate-memory)',
  paging: 'var(--plate-paging)',
  disk: 'var(--plate-disk)',
  practice: 'var(--plate-practice)',
};

function Frame({ tone, children }: { tone: string; children: ReactNode }) {
  // The tone fills the whole card; the drawing is fitted (never cropped) inside it,
  // so the same plate works in portrait, square, landscape and tall cards.
  return (
    <div className="h-full w-full" style={{ background: `radial-gradient(120% 90% at 25% 15%, rgb(255 255 255 / 0.10), transparent 65%), ${tone}` }}>
      <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {children}
      </svg>
    </div>
  );
}

const CPU_SAMPLE = [
  { id: 'P1', arrival: 0, burst: 6, priority: 3 },
  { id: 'P2', arrival: 1, burst: 3, priority: 1 },
  { id: 'P3', arrival: 2, burst: 8, priority: 4 },
  { id: 'P4', arrival: 3, burst: 4, priority: 2 },
  { id: 'P5', arrival: 5, burst: 2, priority: 1 },
];

/** One lane per process; pills where the process holds the CPU. */
export function CpuPlate({ algorithm = 'RR', quantum = 2 }: { algorithm?: CpuAlgorithm; quantum?: number }) {
  const r = useMemo(() => scheduleCpu(CPU_SAMPLE, algorithm, { quantum }), [algorithm, quantum]);
  const x = (t: number) => 26 + (t / r.totalTime) * 248;
  const ids = CPU_SAMPLE.map((p) => p.id);
  return (
    <Frame tone={MODULE_TONE.cpu}>
      {Array.from({ length: r.totalTime + 1 }, (_, t) => (
        <line key={t} x1={x(t)} x2={x(t)} y1="40" y2="360" stroke="var(--plate-ink)" strokeOpacity={t % 5 === 0 ? 0.08 : 0.03} />
      ))}
      {ids.map((pid, i) => {
        const y = 62 + i * 62;
        return (
          <g key={pid}>
            <rect x="26" y={y + 17} width="248" height="2" rx="1" fill="var(--plate-ink)" fillOpacity="0.06" />
            {r.gantt
              .filter((g) => g.pid === pid)
              .map((g, k) => (
                <rect key={k} x={x(g.start) + 1} y={y + 6} width={Math.max(3, x(g.end) - x(g.start) - 2)} height="24" rx="5" fill={PROCESS_COLORS[i]} />
              ))}
          </g>
        );
      })}
    </Frame>
  );
}

/** Memory blocks as towers; allocated processes stacked from the floor. */
export function MemoryPlate({ algorithm = 'BEST_FIT' }: { algorithm?: FitAlgorithm }) {
  const r = useMemo(
    () =>
      allocateMemory(
        [100, 500, 200, 300, 600],
        [212, 417, 112, 426].map((size, i) => ({ id: `P${i + 1}`, size })),
        algorithm,
      ),
    [algorithm],
  );
  const scale = 290 / 600;
  const w = 42;
  return (
    <Frame tone={MODULE_TONE.memory}>
      {r.finalBlocks.map((b, i) => {
        const bx = 24 + i * 52;
        let y = 360;
        return (
          <g key={i}>
            <rect x={bx} y={360 - b.size * scale} width={w} height={b.size * scale} rx="10" fill="none" stroke="var(--plate-ink)" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 4" />
            {b.segments.map((s, k) => {
              const h = s.size * scale;
              y -= h;
              if (!s.owner) return null;
              const pi = Number(s.owner.slice(1)) - 1;
              return <rect key={k} x={bx + 2} y={y + 2} width={w - 4} height={Math.max(2, h - 4)} rx="8" fill={PROCESS_COLORS[pi]} />;
            })}
          </g>
        );
      })}
      <rect x="20" y="364" width="260" height="2" rx="1" fill="var(--plate-ink)" fillOpacity="0.25" />
    </Frame>
  );
}

/** Reference string downwards, frames across: coloured by page, faults outlined. */
export function PagingPlate({ algorithm = 'LRU' }: { algorithm?: PageAlgorithm }) {
  const r = useMemo(() => replacePages([7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], 3, algorithm), [algorithm]);
  const rowH = 17;
  return (
    <Frame tone={MODULE_TONE.paging}>
      {r.steps.map((s, i) => (
        <g key={i}>
          {s.frames.map((p, f) =>
            p === null ? null : (
              <rect
                key={f}
                x={40 + f * 76}
                y={32 + i * rowH}
                width="68"
                height={rowH - 4}
                rx="6.5"
                fill={PROCESS_COLORS[(p * 3) % PROCESS_COLORS.length]}
                fillOpacity={s.slot === f ? 1 : 0.32}
              />
            ),
          )}
          <circle cx="24" cy={32 + i * rowH + (rowH - 4) / 2} r="3.5" fill={s.hit ? 'var(--signal)' : 'var(--fault)'} />
        </g>
      ))}
    </Frame>
  );
}

/** The head's seek path: cylinder across, time downwards. */
export function DiskPlate({ algorithm = 'SCAN' }: { algorithm?: DiskAlgorithm }) {
  const r = useMemo(() => scheduleDisk([98, 183, 37, 122, 14, 124, 65, 67], 53, algorithm, { direction: algorithm === 'SCAN' ? 'down' : 'up' }), [algorithm]);
  const x = (c: number) => 24 + (c / 199) * 252;
  const y = (i: number) => 46 + (i * 310) / Math.max(1, r.path.length - 1);
  return (
    <Frame tone={MODULE_TONE.disk}>
      {r.requests.map((c, i) => (
        <line key={i} x1={x(c)} x2={x(c)} y1="30" y2="370" stroke="var(--plate-ink)" strokeOpacity="0.07" strokeWidth="2" />
      ))}
      {r.moves.map((m, i) => (
        <line
          key={i}
          x1={x(m.from)}
          y1={y(i)}
          x2={x(m.to)}
          y2={y(i + 1)}
          stroke={m.wrap ? 'var(--plate-ink)' : '#d97757'}
          strokeOpacity={m.wrap ? 0.3 : 1}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={m.wrap ? '2 10' : undefined}
        />
      ))}
      {r.path.map((c, i) => (
        <circle key={i} cx={x(c)} cy={y(i)} r={i === 0 ? 9 : 6} fill={i === 0 ? '#c4a35a' : 'var(--plate-disk)'} stroke={i === 0 ? 'none' : '#d97757'} strokeWidth="3" />
      ))}
    </Frame>
  );
}

/** The five-state model as a quiet constellation. */
export function ProcessPlate() {
  const nodes = [
    { x: 70, y: 90, c: '#b0aea5' },
    { x: 150, y: 170, c: '#d4ae5c' },
    { x: 230, y: 90, c: '#9cae78' },
    { x: 230, y: 300, c: '#6a9bcc' },
    { x: 150, y: 330, c: '#d97757' },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 1],
    [2, 3],
    [2, 4],
    [4, 1],
  ];
  return (
    <Frame tone={MODULE_TONE.process}>
      {edges.map(([a, b], i) => {
        const A = nodes[a];
        const B = nodes[b];
        const bend = a > b ? 26 : -18;
        const mx = (A.x + B.x) / 2 + bend;
        const my = (A.y + B.y) / 2 + bend;
        return <path key={i} d={`M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}`} fill="none" stroke="var(--plate-ink)" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />;
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="34" fill={n.c} fillOpacity="0.14" />
          <circle cx={n.x} cy={n.y} r="20" fill={n.c} />
        </g>
      ))}
    </Frame>
  );
}

/** A sheet of answered questions. */
export function PracticePlate() {
  const pattern = 'ccxcccxccccxcccccxccccccxcccccc';
  return (
    <Frame tone={MODULE_TONE.practice}>
      {Array.from({ length: 30 }, (_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const ok = pattern[i] === 'c';
        return <rect key={i} x={34 + col * 48} y={52 + row * 52} width="38" height="38" rx="12" fill={ok ? '#d97757' : 'var(--plate-ink)'} fillOpacity={ok ? 0.9 - row * 0.1 : 0.12} />;
      })}
    </Frame>
  );
}

/** The plate for a module, or for a specific algorithm within it. */
export function ModulePlate({ module, algorithm }: { module: ModuleId | 'practice'; algorithm?: string }) {
  switch (module) {
    case 'cpu':
      return <CpuPlate algorithm={(algorithm as CpuAlgorithm) ?? 'RR'} />;
    case 'memory':
      return <MemoryPlate algorithm={(algorithm as FitAlgorithm) ?? 'BEST_FIT'} />;
    case 'paging':
      return <PagingPlate algorithm={(algorithm as PageAlgorithm) ?? 'LRU'} />;
    case 'disk':
      return <DiskPlate algorithm={(algorithm as DiskAlgorithm) ?? 'SCAN'} />;
    case 'process':
      return <ProcessPlate />;
    default:
      return <PracticePlate />;
  }
}
