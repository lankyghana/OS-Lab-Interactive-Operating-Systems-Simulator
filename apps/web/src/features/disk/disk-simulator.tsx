'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DISK_ALGORITHMS, scheduleDisk, type DiskAlgorithm, type DiskResult, type Direction } from '@os-lab/engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Table, Td, Th } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { BarChart } from '@/components/charts/bar-chart';
import { LabBox, LabPanel, PlaybackControls, SimulatorFrame, Stat, type SimTab } from '@/components/sim/lab';
import { usePlayback } from '@/lib/use-playback';
import { presetStore, progress } from '@/lib/progress';
import { cn, parseNumberList } from '@/lib/utils';

export interface DiskPreset {
  requests: number[];
  head: number;
  cylinders: number;
  direction: Direction;
  algorithm?: DiskAlgorithm;
}

const DEFAULT: DiskPreset = { requests: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, cylinders: 200, direction: 'up' };

/** Seek-path chart: cylinder on the x-axis, service order down the y-axis. */
export function SeekGraph({ result, upTo, tone = 'light' }: { result: DiskResult; upTo?: number; tone?: 'light' | 'lab' }) {
  const lab = tone === 'lab';
  const W = 720;
  const rowH = 28;
  const pad = { l: 16, r: 16, t: 46, b: 14 };
  const max = result.cylinders - 1;
  const n = result.path.length;
  const H = pad.t + (n - 1) * rowH + pad.b;
  const x = (c: number) => pad.l + (c / max) * (W - pad.l - pad.r);
  const y = (i: number) => pad.t + i * rowH;
  const shown = upTo === undefined ? n - 1 : upTo;
  const pts = result.path.slice(0, shown + 1);
  const ink = lab ? 'var(--lab-text)' : 'var(--ink)';
  const dim = lab ? 'var(--lab-dim)' : 'var(--faint)';
  const grid = lab ? 'rgb(255 255 255/0.06)' : 'var(--line)';
  const accent = lab ? 'var(--signal)' : 'var(--brand)';
  const ticks = Array.from(new Set([0, ...result.requests, result.head, max])).sort((a, b) => a - b);
  // Alternate label rows when neighbouring ticks would overlap.
  const raised = new Set<number>();
  ticks.forEach((t, i) => {
    if (i > 0 && x(t) - x(ticks[i - 1]) < 24 && !raised.has(ticks[i - 1])) raised.add(t);
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px]" role="img" aria-label={`Head path: ${result.path.join(' → ')}`}>
        <line x1={x(0)} x2={x(max)} y1={pad.t - 14} y2={pad.t - 14} stroke={dim} />
        {ticks.map((t) => {
          const isReq = result.requests.includes(t);
          const served = result.order.slice(0, Math.max(0, shown)).includes(t);
          return (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={pad.t - 14} y2={H - pad.b} stroke={grid} strokeDasharray={isReq ? '' : '2 4'} />
              <text x={x(t)} y={pad.t - (raised.has(t) ? 31 : 20)} textAnchor="middle" fontSize="10.5" fontFamily="ui-monospace, monospace" fill={t === result.head ? accent : isReq ? (served ? dim : ink) : dim} fontWeight={t === result.head ? 700 : 400}>
                {t}
              </text>
            </g>
          );
        })}
        {pts.slice(1).map((p, i) => {
          const m = result.moves[i];
          return (
            <line
              key={i}
              x1={x(pts[i])}
              y1={y(i)}
              x2={x(p)}
              y2={y(i + 1)}
              stroke={m.wrap ? dim : accent}
              strokeWidth={2.2}
              strokeDasharray={m.wrap ? '5 5' : undefined}
              markerEnd="url(#arrow)"
            />
          );
        })}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={accent} />
          </marker>
        </defs>
        {pts.map((p, i) => {
          const m = i > 0 ? result.moves[i - 1] : null;
          const current = i === pts.length - 1;
          return (
            <g key={i}>
              <circle cx={x(p)} cy={y(i)} r={current ? 6.5 : 4} fill={current ? accent : m && !m.service ? dim : lab ? 'var(--lab-panel)' : 'var(--surface)'} stroke={m && !m.service ? dim : accent} strokeWidth={2} />
              <text x={x(p) + (p > max * 0.85 ? -10 : 10)} y={y(i) + 4} textAnchor={p > max * 0.85 ? 'end' : 'start'} fontSize="10.5" fontFamily="ui-monospace, monospace" fill={dim}>
                {i === 0 ? `start ${p}` : m && m.distance ? `+${m.distance}` : m?.wrap ? 'return' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DiskResults({ result }: { result: DiskResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">Service order</p>
        <p className="font-mono text-sm">{result.path.join(' → ')}</p>
      </div>
      <SeekGraph result={result} />
      <Table>
        <thead>
          <tr>
            <Th>#</Th>
            <Th className="text-right">From</Th>
            <Th className="text-right">To</Th>
            <Th className="text-right">Distance</Th>
            <Th>Note</Th>
          </tr>
        </thead>
        <tbody>
          {result.moves.map((m, i) => (
            <tr key={i}>
              <Td className="text-faint">{i + 1}</Td>
              <Td className="text-right">{m.from}</Td>
              <Td className="text-right font-semibold">{m.to}</Td>
              <Td className="text-right" title={`|${m.to} − ${m.from}|`}>
                {m.distance}
              </Td>
              <Td className="text-muted">{m.wrap ? 'Return sweep' : m.service ? 'Service request' : 'Travel to disk end'}</Td>
            </tr>
          ))}
          <tr>
            <Td colSpan={3} className="text-right font-semibold">
              Total head movement
            </Td>
            <Td className="text-right text-base font-bold">{result.totalMovement}</Td>
            <Td />
          </tr>
        </tbody>
      </Table>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Total head movement" value={result.totalMovement} hint="cylinders" />
        <Stat label="Average seek" value={result.averageSeek} hint={`${result.totalMovement} ÷ ${result.requests.length} requests`} />
        <Stat label="Requests" value={result.requests.length} />
      </div>
    </div>
  );
}

function DiskVisual({ result, onStart }: { result: DiskResult; onStart: () => void }) {
  const pb = usePlayback(result.path.length, result, onStart);
  const pos = result.path[pb.index];
  const travelled = result.moves.slice(0, pb.index).reduce((a, m) => a + m.distance, 0);
  const served = result.moves.slice(0, pb.index).filter((m) => m.service).map((m) => m.to);
  const pending = [...result.requests];
  served.forEach((s) => pending.splice(pending.indexOf(s), 1));
  const move = pb.index > 0 ? result.moves[pb.index - 1] : null;
  const max = result.cylinders - 1;

  return (
    <LabPanel title={`Disk arm · ${result.algorithm.replace('_', '-')} · ${result.cylinders} cylinders`} meta={<span>travelled {travelled}</span>}>
      <div className="flex flex-col gap-4">
        <PlaybackControls pb={pb} stepLabel="Next move" positionLabel={`move ${pb.index} / ${result.moves.length}`} />
        <LabBox label="Disk surface (cylinders)">
          <div className="relative mx-2 mb-1 mt-6 h-10">
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-lab-raised ring-1 ring-lab-line" />
            {result.requests.map((r, i) => (
              <span
                key={i}
                className={cn('absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm transition-colors', served.includes(r) ? 'bg-lab-dim/40' : 'bg-warn')}
                style={{ left: `${(r / max) * 100}%` }}
                title={`Request ${r}`}
              />
            ))}
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500 ease-out" style={{ left: `${(pos / max) * 100}%` }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-signal px-1.5 font-mono text-[11px] font-bold text-lab">{pos}</span>
              <span className="block h-7 w-7 rounded-full border-2 border-signal bg-signal/20 animate-pulse-ring" />
            </div>
          </div>
          <div className="flex justify-between font-mono text-[10.5px] text-lab-dim">
            <span>0</span>
            <span>{max}</span>
          </div>
        </LabBox>
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <LabBox label="Seek path">
            <SeekGraph result={result} upTo={pb.index} tone="lab" />
          </LabBox>
          <div className="flex flex-col gap-3">
            <LabBox label="Last move">
              {move ? (
                <p className="font-mono text-sm">
                  {move.from} → <span className="text-signal">{move.to}</span>{' '}
                  <span className="text-lab-dim">{move.wrap ? (move.distance ? `(return, ${move.distance})` : '(return, not counted)') : `(${move.distance} cylinders)`}</span>
                  <span className="mt-1 block text-xs text-lab-dim">{move.wrap ? 'Jump back to the start of the disk' : move.service ? 'Request serviced' : 'Travel to the end of the disk'}</span>
                </p>
              ) : (
                <p className="font-mono text-xs text-lab-dim">Head parked at {result.head}.</p>
              )}
            </LabBox>
            <LabBox label={`Pending requests (${pending.length})`}>
              <div className="flex flex-wrap gap-1.5 font-mono text-[12px]">
                {pending.length === 0 && <span className="text-lab-dim">all serviced</span>}
                {pending.map((r, i) => (
                  <span key={i} className="rounded bg-warn/15 px-1.5 py-0.5 text-warn">
                    {r}
                  </span>
                ))}
              </div>
            </LabBox>
            <Stat tone="lab" label="Head movement" value={travelled} hint={pb.index === pb.last ? `avg seek ${result.averageSeek}` : 'so far'} />
          </div>
        </div>
      </div>
    </LabPanel>
  );
}

export function DiskSimulator() {
  const [preset] = useState(() => presetStore.peek<DiskPreset>('disk'));
  useEffect(() => {
    presetStore.clear('disk');
  }, []);
  const init = preset ?? DEFAULT;
  const [reqText, setReqText] = useState(init.requests.join(', '));
  const [headText, setHeadText] = useState(String(init.head));
  const [cylText, setCylText] = useState(String(init.cylinders));
  const [direction, setDirection] = useState<Direction>(init.direction);
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>(init.algorithm ?? 'FCFS');
  const [countReturn, setCountReturn] = useState(true);
  const [tab, setTab] = useState<SimTab>('visual');
  const [calculated, setCalculated] = useState<DiskResult | null>(null);

  const requests = useMemo(() => parseNumberList(reqText), [reqText]);
  const head = headText === '' ? NaN : Number(headText);
  const cylinders = cylText === '' ? NaN : Number(cylText);
  const opts = { cylinders, direction, countReturnSweep: countReturn };

  const { result, error } = useMemo(() => {
    try {
      return { result: scheduleDisk(requests, head, algorithm, { cylinders, direction, countReturnSweep: countReturn }), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [requests, head, algorithm, cylinders, direction, countReturn]);

  const comparison = useMemo(() => (tab !== 'compare' || error ? null : DISK_ALGORITHMS.map((a) => scheduleDisk(requests, head, a.id, opts))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, error, requests, head, cylinders, direction, countReturn]);
  const lastCompared = useRef('');
  useEffect(() => {
    if (!comparison) return;
    const k = JSON.stringify([requests, head, cylinders, direction]);
    if (k !== lastCompared.current) {
      lastCompared.current = k;
      progress.recordSimulation({ module: 'disk', algorithm: 'ALL', mode: 'compare' });
    }
  }, [comparison, requests, head, cylinders, direction]);

  const needsDirection = algorithm !== 'FCFS';
  const inputs = (
    <Card>
      <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_260px] *:min-w-0">
        <div className="grid gap-4 sm:grid-cols-[120px_120px_1fr]">
          <div className="sm:col-span-3">
            <Label htmlFor="dk-req">Request queue (cylinders, in arrival order)</Label>
            <Input id="dk-req" value={reqText} onChange={(e) => setReqText(e.target.value)} className="font-mono" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => { setReqText(DEFAULT.requests.join(', ')); setHeadText('53'); setCylText('200'); }}>
                Textbook queue
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const c = Number(cylText) || 200;
                  setReqText(Array.from({ length: 8 }, () => Math.floor(Math.random() * c)).join(', '));
                  setHeadText(String(Math.floor(Math.random() * c)));
                }}
              >
                Random
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="dk-head">Head start</Label>
            <Input id="dk-head" type="number" min={0} value={headText} onChange={(e) => setHeadText(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dk-cyl">Cylinders</Label>
            <Input id="dk-cyl" type="number" min={2} value={cylText} onChange={(e) => setCylText(e.target.value)} />
          </div>
          <div>
            <Label>Direction</Label>
            <Tabs<Direction>
              value={direction}
              onChange={setDirection}
              items={[
                { value: 'up', label: '↑ Higher' },
                { value: 'down', label: '↓ Lower' },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-5">
          <div>
            <Label htmlFor="dk-algo">Algorithm</Label>
            <Select id="dk-algo" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as DiskAlgorithm)}>
              <optgroup label="Core">
                {DISK_ALGORITHMS.filter((a) => a.core).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Extra">
                {DISK_ALGORITHMS.filter((a) => !a.core).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            </Select>
            {!needsDirection && <p className="mt-1.5 text-xs text-muted">FCFS ignores the direction.</p>}
          </div>
          {(algorithm === 'C_SCAN' || algorithm === 'C_LOOK') && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={countReturn} onChange={(e) => setCountReturn(e.target.checked)} className="h-4 w-4 accent-brand" />
              Count the return sweep in the total
            </label>
          )}
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SimulatorFrame
      module="disk"
      eyebrow="Simulators / Disk Scheduling"
      title="Disk Scheduling"
      description="Move the disk head across the cylinders to service a queue of requests. Compare how far each strategy makes the arm travel."
      algorithm={algorithm}
      tab={tab}
      onTab={setTab}
      inputs={inputs}
    >
      {tab === 'visual' &&
        (result ? (
          <DiskVisual result={result} onStart={() => progress.recordSimulation({ module: 'disk', algorithm, mode: 'visual' })} />
        ) : (
          <Alert tone="warn" title="Fix the input to run the simulation">{error}</Alert>
        ))}
      {tab === 'text' && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Button disabled={!result} onClick={() => { setCalculated(result); progress.recordSimulation({ module: 'disk', algorithm, mode: 'text' }); }}>
                Calculate head movement
              </Button>
              {calculated && result && JSON.stringify([calculated.requests, calculated.head, calculated.algorithm, calculated.direction, calculated.cylinders, calculated.totalMovement]) !== JSON.stringify([result.requests, result.head, result.algorithm, result.direction, result.cylinders, result.totalMovement]) && (
                <span className="text-sm text-amber">Inputs changed. Recalculate to update.</span>
              )}
            </div>
            {calculated && <DiskResults result={calculated} />}
          </CardContent>
        </Card>
      )}
      {tab === 'compare' &&
        (comparison ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold">Total head movement</p>
                <BarChart data={comparison.map((c) => ({ label: c.algorithm.replace('_', '-'), value: c.totalMovement, highlight: c.algorithm === algorithm }))} unit="cyl" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <Table>
                  <thead>
                    <tr>
                      <Th>Algorithm</Th>
                      <Th>Order</Th>
                      <Th className="text-right">Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((c) => (
                      <tr key={c.algorithm} className={cn(c.algorithm === algorithm && 'bg-brand-soft/50')}>
                        <Td className="font-medium whitespace-nowrap">{c.algorithm.replace('_', '-')}</Td>
                        <Td className="font-mono text-xs text-muted">{c.path.join(' → ')}</Td>
                        <Td className="text-right font-semibold">{c.totalMovement}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert tone="warn" title="Fix the input to compare">{error}</Alert>
        ))}
    </SimulatorFrame>
  );
}
