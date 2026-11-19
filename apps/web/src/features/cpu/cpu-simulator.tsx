'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CPU_ALGORITHMS, compareCpu, scheduleCpu, type CpuAlgorithm, type CpuResult, type ProcessInput } from '@os-lab/engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Table, Td, Th } from '@/components/ui/table';
import { BarChart } from '@/components/charts/bar-chart';
import { SimulatorFrame, type SimTab } from '@/components/sim/lab';
import { IconPlus, IconX, IconSparkle } from '@/components/icons';
import { presetStore, progress } from '@/lib/progress';
import { cn, colorFor, fmt } from '@/lib/utils';
import { CpuVisual } from './cpu-visual';
import { CpuResults } from './cpu-results';

export interface CpuPreset {
  processes: ProcessInput[];
  algorithm?: CpuAlgorithm;
  quantum?: number;
}

interface Row {
  id: string;
  arrival: string;
  burst: string;
  priority: string;
}

const toRows = (ps: ProcessInput[]): Row[] =>
  ps.map((p) => ({ id: p.id, arrival: String(p.arrival), burst: String(p.burst), priority: String(p.priority ?? 1) }));

const PRESETS: { label: string; processes: ProcessInput[] }[] = [
  {
    label: 'Course example',
    processes: [
      { id: 'P1', arrival: 0, burst: 5, priority: 3 },
      { id: 'P2', arrival: 1, burst: 3, priority: 1 },
      { id: 'P3', arrival: 2, burst: 8, priority: 4 },
      { id: 'P4', arrival: 3, burst: 6, priority: 2 },
    ],
  },
  {
    label: 'Convoy effect',
    processes: [
      { id: 'P1', arrival: 0, burst: 24, priority: 2 },
      { id: 'P2', arrival: 0, burst: 3, priority: 1 },
      { id: 'P3', arrival: 0, burst: 3, priority: 3 },
    ],
  },
  {
    label: 'Staggered arrivals',
    processes: [
      { id: 'P1', arrival: 0, burst: 8, priority: 3 },
      { id: 'P2', arrival: 1, burst: 4, priority: 1 },
      { id: 'P3', arrival: 2, burst: 9, priority: 4 },
      { id: 'P4', arrival: 3, burst: 5, priority: 2 },
      { id: 'P5', arrival: 12, burst: 2, priority: 1 },
    ],
  },
];

function randomProcesses(): ProcessInput[] {
  const n = 4 + Math.floor(Math.random() * 3);
  return Array.from({ length: n }, (_, i) => ({
    id: `P${i + 1}`,
    arrival: i === 0 ? 0 : Math.floor(Math.random() * 8),
    burst: 1 + Math.floor(Math.random() * 9),
    priority: 1 + Math.floor(Math.random() * 5),
  }));
}

export function CpuSimulator() {
  const [preset] = useState(() => presetStore.peek<CpuPreset>('cpu'));
  useEffect(() => {
    presetStore.clear('cpu');
  }, []);
  const [rows, setRows] = useState<Row[]>(() => toRows(preset?.processes ?? PRESETS[0].processes));
  const [algorithm, setAlgorithm] = useState<CpuAlgorithm>(preset?.algorithm ?? 'FCFS');
  const [quantum, setQuantum] = useState(String(preset?.quantum ?? 2));
  const [tab, setTab] = useState<SimTab>('visual');
  const [calculated, setCalculated] = useState<CpuResult | null>(null);

  const usesPriority = algorithm.startsWith('PRIORITY');
  const processes: ProcessInput[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id.trim(),
        arrival: r.arrival === '' ? NaN : Number(r.arrival),
        burst: r.burst === '' ? NaN : Number(r.burst),
        priority: r.priority === '' ? 0 : Number(r.priority),
      })),
    [rows],
  );
  const q = Number(quantum);

  const { result, error } = useMemo(() => {
    try {
      return { result: scheduleCpu(processes, algorithm, { quantum: q }), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [processes, algorithm, q]);

  const comparison = useMemo(() => {
    if (tab !== 'compare' || error) return null;
    try {
      return compareCpu(processes, undefined, { quantum: q });
    } catch {
      return null;
    }
  }, [tab, processes, q, error]);

  // Record a comparison once per distinct input.
  const lastCompared = useRef('');
  useEffect(() => {
    if (!comparison) return;
    const key = JSON.stringify([processes, q]);
    if (key === lastCompared.current) return;
    lastCompared.current = key;
    progress.recordSimulation({ module: 'cpu', algorithm: 'ALL', mode: 'compare', summary: `${processes.length} processes` });
  }, [comparison, processes, q]);

  const stale = calculated && result && JSON.stringify([calculated.processes.map((p) => [p.id, p.arrival, p.burst, p.priority]), calculated.algorithm, calculated.quantum]) !== JSON.stringify([result.processes.map((p) => [p.id, p.arrival, p.burst, p.priority]), result.algorithm, result.quantum]);

  const update = (i: number, field: keyof Row, value: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  const nextId = () => {
    let k = rows.length + 1;
    while (rows.some((r) => r.id === `P${k}`)) k++;
    return `P${k}`;
  };

  const inputs = (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_260px] *:min-w-0">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Label className="mb-0">Processes</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <Button key={p.label} size="sm" variant="ghost" onClick={() => setRows(toRows(p.processes))}>
                    {p.label}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setRows(toRows(randomProcesses()))}>
                  <IconSparkle size={14} /> Random
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-muted">
                    <th className="pb-1.5 pr-2 font-semibold">Process</th>
                    <th className="pb-1.5 pr-2 font-semibold">Arrival time</th>
                    <th className="pb-1.5 pr-2 font-semibold">Burst time</th>
                    <th className={cn('pb-1.5 pr-2 font-semibold', !usesPriority && 'opacity-40')}>Priority</th>
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-sm" style={{ background: colorFor(r.id, rows.map((x) => x.id)) }} />
                          <Input aria-label={`Process ${i + 1} ID`} value={r.id} onChange={(e) => update(i, 'id', e.target.value)} className="pl-7 font-mono" maxLength={6} />
                        </div>
                      </td>
                      <td className="py-1 pr-2">
                        <Input aria-label={`${r.id} arrival time`} type="number" min={0} inputMode="numeric" value={r.arrival} onChange={(e) => update(i, 'arrival', e.target.value)} />
                      </td>
                      <td className="py-1 pr-2">
                        <Input aria-label={`${r.id} burst time`} type="number" min={1} inputMode="numeric" value={r.burst} onChange={(e) => update(i, 'burst', e.target.value)} />
                      </td>
                      <td className="py-1 pr-2">
                        <Input aria-label={`${r.id} priority`} type="number" inputMode="numeric" value={r.priority} onChange={(e) => update(i, 'priority', e.target.value)} disabled={!usesPriority} />
                      </td>
                      <td className="py-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${r.id}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} disabled={rows.length <= 1}>
                          <IconX size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={rows.length >= 12}
              onClick={() => setRows((rs) => [...rs, { id: nextId(), arrival: String(Math.max(0, ...rs.map((r) => Number(r.arrival) || 0))), burst: '4', priority: '2' }])}
            >
              <IconPlus size={15} /> Add process
            </Button>
          </div>

          <div className="flex flex-col gap-4 lg:border-l lg:border-line lg:pl-5">
            <div>
              <Label htmlFor="cpu-algo">Algorithm</Label>
              <Select id="cpu-algo" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as CpuAlgorithm)}>
                {CPU_ALGORITHMS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-muted">
                {CPU_ALGORITHMS.find((a) => a.id === algorithm)!.preemptive ? 'Preemptive' : 'Non-preemptive'}
                {usesPriority && ' · lower number = higher priority'}
              </p>
            </div>
            {algorithm === 'RR' && (
              <div>
                <Label htmlFor="cpu-q">Time quantum</Label>
                <Input id="cpu-q" type="number" min={1} value={quantum} onChange={(e) => setQuantum(e.target.value)} />
              </div>
            )}
            {error && <Alert tone="error">{error}</Alert>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SimulatorFrame
      module="cpu"
      eyebrow="Simulators / CPU Scheduling"
      title="CPU Scheduling"
      description="Decide which ready process gets the CPU. Watch the ready queue, the CPU and the Gantt chart evolve one time unit at a time, or compute every metric instantly."
      algorithm={algorithm}
      tab={tab}
      onTab={setTab}
      inputs={inputs}
    >
      {tab === 'visual' &&
        (result ? (
          <CpuVisual result={result} onStart={() => progress.recordSimulation({ module: 'cpu', algorithm, mode: 'visual', summary: `${processes.length} processes` })} />
        ) : (
          <Alert tone="warn" title="Fix the input to run the simulation">
            {error}
          </Alert>
        ))}

      {tab === 'text' && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Button
                disabled={!result}
                onClick={() => {
                  setCalculated(result);
                  progress.recordSimulation({ module: 'cpu', algorithm, mode: 'text', summary: `avg WT ${result!.averageWaiting}` });
                }}
              >
                Calculate results
              </Button>
              {stale && <span className="text-sm text-amber">Inputs changed. Recalculate to update the results.</span>}
              {!calculated && <span className="text-sm text-muted">Enter the processes above, choose an algorithm, then calculate.</span>}
            </div>
            {calculated && <CpuResults result={calculated} />}
          </CardContent>
        </Card>
      )}

      {tab === 'compare' &&
        (comparison ? (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <p className="mb-3 text-sm text-muted">
                  The same {processes.length} processes run through every algorithm{` (Round Robin uses q = ${q})`}.
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Algorithm</Th>
                      <Th className="text-right">Avg WT</Th>
                      <Th className="text-right">Avg TAT</Th>
                      <Th className="text-right">Avg RT</Th>
                      <Th className="text-right">Switches</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((c) => (
                      <tr key={c.algorithm} className={cn(c.algorithm === algorithm && 'bg-brand-soft/50')}>
                        <Td className="font-medium">{CPU_ALGORITHMS.find((a) => a.id === c.algorithm)!.name}</Td>
                        <Td className="text-right">{fmt(c.averageWaiting)}</Td>
                        <Td className="text-right">{fmt(c.averageTurnaround)}</Td>
                        <Td className="text-right">{fmt(c.averageResponse)}</Td>
                        <Td className="text-right">{c.contextSwitches}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-6 p-4 sm:p-5">
                {(
                  [
                    ['Average waiting time', 'averageWaiting'],
                    ['Average turnaround time', 'averageTurnaround'],
                  ] as const
                ).map(([title, k]) => (
                  <div key={k}>
                    <p className="mb-2.5 text-sm font-semibold">{title}</p>
                    <BarChart data={comparison.map((c) => ({ label: c.algorithm.replace('_P', ' (P)'), value: c[k], highlight: c.algorithm === algorithm }))} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert tone="warn" title="Fix the input to compare algorithms">
            {error}
          </Alert>
        ))}
    </SimulatorFrame>
  );
}
