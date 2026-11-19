'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PAGE_ALGORITHMS, parseReferenceString, replacePages, type PageAlgorithm, type PageResult } from '@os-lab/engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { BarChart, LineChart } from '@/components/charts/bar-chart';
import { LabBox, LabPanel, PlaybackControls, SimulatorFrame, Stat, type SimTab } from '@/components/sim/lab';
import { usePlayback } from '@/lib/use-playback';
import { presetStore, progress } from '@/lib/progress';
import { cn } from '@/lib/utils';

export interface PagingPreset {
  reference: number[];
  frames: number;
  algorithm?: PageAlgorithm;
}

const SILBERSCHATZ = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
const BELADY = '1 2 3 4 1 2 5 1 2 3 4 5';

/** Classic frame table: one column per reference, one row per frame. */
export function FrameTable({ result, upTo, tone = 'light' }: { result: PageResult; upTo?: number; tone?: 'light' | 'lab' }) {
  const last = upTo ?? result.steps.length - 1;
  const lab = tone === 'lab';
  return (
    <div className="overflow-x-auto pb-1">
      <table className="border-separate border-spacing-[3px] font-mono text-[12.5px] tabular">
        <thead>
          <tr>
            <th className={cn('pr-2 text-left text-[10.5px] font-medium uppercase', lab ? 'text-lab-dim' : 'text-muted')}>Ref</th>
            {result.steps.map((s, i) => (
              <th
                key={i}
                className={cn(
                  'h-8 w-8 min-w-8 rounded-md text-[13px] font-bold transition-colors',
                  i === last && upTo !== undefined ? (lab ? 'bg-signal text-lab' : 'bg-brand text-white') : i > last ? (lab ? 'text-lab-dim/50' : 'text-faint') : lab ? 'text-lab-text' : 'text-ink',
                )}
              >
                {s.page}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: result.frameCount }, (_, f) => (
            <tr key={f}>
              <td className={cn('pr-2 text-[10.5px] uppercase', lab ? 'text-lab-dim' : 'text-muted')}>F{f + 1}</td>
              {result.steps.map((s, i) => {
                const v = s.frames[f];
                const changed = s.slot === f;
                const visible = i <= last;
                return (
                  <td
                    key={i}
                    className={cn(
                      'h-8 w-8 min-w-8 rounded-md text-center transition-all',
                      !visible && 'opacity-0',
                      lab ? 'bg-lab-panel ring-1 ring-lab-line' : 'bg-ink/[0.05]',
                      changed && (lab ? 'bg-fault/20 font-bold text-fault ring-fault/50' : 'bg-bad-soft font-bold text-bad'),
                      s.hit && s.frames[f] === s.page && (lab ? 'bg-signal/15 font-bold text-signal ring-signal/40' : 'bg-ok-soft font-bold text-ok'),
                    )}
                  >
                    {v ?? ''}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className={cn('pr-2 text-[10.5px] uppercase', lab ? 'text-lab-dim' : 'text-muted')}>Fault</td>
            {result.steps.map((s, i) => (
              <td key={i} className={cn('h-6 text-center text-[11px] font-bold', i > last && 'opacity-0', s.hit ? (lab ? 'text-signal' : 'text-ok') : lab ? 'text-fault' : 'text-bad')}>
                {s.hit ? 'H' : 'F'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PagingResults({ result }: { result: PageResult }) {
  return (
    <div className="flex flex-col gap-5">
      <FrameTable result={result} />
      <p className="text-xs text-muted">
        <span className="font-semibold text-bad">Red</span> = page loaded on a fault, <span className="font-semibold text-ok">green</span> = hit. F = fault, H = hit.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Page faults" value={result.faults} />
        <Stat label="Hits" value={result.hits} />
        <Stat label="Hit ratio" value={`${result.hitRatio}%`} hint={`${result.hits} ÷ ${result.reference.length}`} />
        <Stat label="Fault ratio" value={`${result.faultRatio}%`} hint={`${result.faults} ÷ ${result.reference.length}`} />
      </div>
      <ol className="flex flex-col gap-1 text-sm">
        {result.steps.map((s) => (
          <li key={s.index} className="flex gap-2">
            <span className="w-7 shrink-0 text-right font-mono text-faint">{s.index + 1}.</span>
            <span className={s.hit ? 'text-ok' : ''}>{s.explanation}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PagingVisual({ result, onStart }: { result: PageResult; onStart: () => void }) {
  const pb = usePlayback(result.steps.length + 1, result, onStart);
  const cur = pb.index - 1;
  const step = cur >= 0 ? result.steps[cur] : null;
  const faultsSoFar = result.steps.slice(0, pb.index).filter((s) => !s.hit).length;
  return (
    <LabPanel title={`Virtual memory · ${result.algorithm} · ${result.frameCount} frames`} meta={<span>faults {faultsSoFar}</span>}>
      <div className="flex flex-col gap-4">
        <PlaybackControls pb={pb} stepLabel="Next reference" positionLabel={`ref ${pb.index} / ${result.steps.length}`} />
        <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
          <LabBox label="Physical frames">
            <div className="flex flex-col gap-2">
              {Array.from({ length: result.frameCount }, (_, f) => {
                const v = step ? step.frames[f] : null;
                const changed = step && step.slot === f;
                const hit = step?.hit && v === step.page;
                return (
                  <div
                    key={f}
                    className={cn(
                      'flex h-11 items-center justify-between rounded-lg border px-3 font-mono transition-all',
                      changed ? 'border-fault/60 bg-fault/15' : hit ? 'border-signal/60 bg-signal/10' : 'border-lab-line bg-lab',
                    )}
                  >
                    <span className="text-[10.5px] uppercase text-lab-dim">Frame {f + 1}</span>
                    <span className={cn('text-lg font-bold', changed ? 'text-fault' : hit ? 'text-signal' : 'text-lab-text')}>{v ?? '—'}</span>
                  </div>
                );
              })}
            </div>
          </LabBox>
          <div className="flex flex-col gap-3">
            <LabBox label="What just happened">
              {step ? (
                <div className="flex items-start gap-3">
                  <span className={cn('rounded-md px-2 py-1 font-mono text-xs font-bold', step.hit ? 'bg-signal/15 text-signal' : 'bg-fault/15 text-fault')}>
                    {step.hit ? 'HIT' : 'PAGE FAULT'}
                  </span>
                  <p className="text-sm text-lab-text">{step.explanation}</p>
                </div>
              ) : (
                <p className="font-mono text-xs text-lab-dim">All frames start empty. Press Start.</p>
              )}
            </LabBox>
            <LabBox label="Reference string">
              <FrameTable result={result} upTo={cur} tone="lab" />
            </LabBox>
          </div>
        </div>
        {pb.index === pb.last && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 animate-slide-in">
            <Stat tone="lab" label="Page faults" value={result.faults} />
            <Stat tone="lab" label="Hits" value={result.hits} />
            <Stat tone="lab" label="Hit ratio" value={`${result.hitRatio}%`} />
            <Stat tone="lab" label="Fault ratio" value={`${result.faultRatio}%`} />
          </div>
        )}
      </div>
    </LabPanel>
  );
}

export function PagingSimulator() {
  const [preset] = useState(() => presetStore.peek<PagingPreset>('paging'));
  useEffect(() => {
    presetStore.clear('paging');
  }, []);
  const [refText, setRefText] = useState(preset ? preset.reference.join(' ') : SILBERSCHATZ);
  const [framesText, setFramesText] = useState(String(preset?.frames ?? 3));
  const [algorithm, setAlgorithm] = useState<PageAlgorithm>(preset?.algorithm ?? 'FIFO');
  const [tab, setTab] = useState<SimTab>('visual');
  const [calculated, setCalculated] = useState<PageResult | null>(null);
  const frames = Number(framesText);

  const { result, error, reference } = useMemo(() => {
    try {
      const reference = parseReferenceString(refText);
      return { result: replacePages(reference, frames, algorithm), error: null, reference };
    } catch (e) {
      return { result: null, error: (e as Error).message, reference: [] as number[] };
    }
  }, [refText, frames, algorithm]);

  const comparison = useMemo(() => {
    if (tab !== 'compare' || error) return null;
    const sweep = Array.from({ length: 7 }, (_, i) => i + 1);
    return {
      now: PAGE_ALGORITHMS.map((a) => replacePages(reference, frames, a.id)),
      sweep,
      series: PAGE_ALGORITHMS.map((a, k) => ({
        name: a.id === 'OPTIMAL' ? 'Optimal' : a.id,
        color: ['#d97757', '#6a9bcc', '#788c5d'][k],
        values: sweep.map((f) => replacePages(reference, f, a.id).faults),
      })),
    };
  }, [tab, error, reference, frames]);
  const lastCompared = useRef('');
  useEffect(() => {
    if (!comparison) return;
    const k = JSON.stringify([reference, frames]);
    if (k !== lastCompared.current) {
      lastCompared.current = k;
      progress.recordSimulation({ module: 'paging', algorithm: 'ALL', mode: 'compare' });
    }
  }, [comparison, reference, frames]);

  const fifo = comparison?.series[0].values;
  const belady = fifo ? fifo.findIndex((v, i) => i > 0 && v > fifo[i - 1]) : -1;

  const inputs = (
    <Card>
      <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_140px_240px]">
        <div>
          <Label htmlFor="pg-ref">Reference string</Label>
          <Input id="pg-ref" value={refText} onChange={(e) => setRefText(e.target.value)} className="font-mono" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => { setRefText(SILBERSCHATZ); setFramesText('3'); }}>
              Textbook string
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setRefText(BELADY); setFramesText('3'); setAlgorithm('FIFO'); }}>
              Belady’s anomaly
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRefText(Array.from({ length: 16 }, () => Math.floor(Math.random() * 8)).join(' '))}>
              Random
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="pg-frames">Frames</Label>
          <Input id="pg-frames" type="number" min={1} max={20} value={framesText} onChange={(e) => setFramesText(e.target.value)} />
        </div>
        <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-5">
          <div>
            <Label htmlFor="pg-algo">Algorithm</Label>
            <Select id="pg-algo" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as PageAlgorithm)}>
              {PAGE_ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SimulatorFrame
      module="paging"
      eyebrow="Simulators / Virtual Memory"
      title="Page Replacement"
      description="Feed a reference string through a fixed number of frames. Watch each hit and page fault, and see which page each algorithm chooses to evict."
      algorithm={algorithm}
      tab={tab}
      onTab={setTab}
      inputs={inputs}
    >
      {tab === 'visual' &&
        (result ? (
          <PagingVisual result={result} onStart={() => progress.recordSimulation({ module: 'paging', algorithm, mode: 'visual' })} />
        ) : (
          <Alert tone="warn" title="Fix the input to run the simulation">{error}</Alert>
        ))}
      {tab === 'text' && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Button disabled={!result} onClick={() => { setCalculated(result); progress.recordSimulation({ module: 'paging', algorithm, mode: 'text' }); }}>
                Calculate page faults
              </Button>
              {calculated && result && (calculated.reference.join() !== result.reference.join() || calculated.frameCount !== result.frameCount || calculated.algorithm !== result.algorithm) && (
                <span className="text-sm text-amber">Inputs changed. Recalculate to update.</span>
              )}
            </div>
            {calculated && <PagingResults result={calculated} />}
          </CardContent>
        </Card>
      )}
      {tab === 'compare' &&
        (comparison ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold">Page faults with {frames} frames</p>
                <BarChart data={comparison.now.map((c) => ({ label: PAGE_ALGORITHMS.find((a) => a.id === c.algorithm)!.name, value: c.faults, highlight: c.algorithm === algorithm }))} unit="faults" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <p className="mb-1 text-sm font-semibold">Faults as the number of frames grows</p>
                <p className="mb-2 text-xs text-muted">Each line should fall as frames are added. If the FIFO line rises, that is Belady’s anomaly.</p>
                <LineChart series={comparison.series} xLabels={comparison.sweep.map((f) => `${f}f`)} yLabel="Page faults by number of frames" />
                {belady > 0 && (
                  <Alert tone="warn" className="mt-3" title="Belady’s anomaly detected">
                    FIFO causes {fifo![belady]} faults with {belady + 1} frames but only {fifo![belady - 1]} with {belady}.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert tone="warn" title="Fix the input to compare">{error}</Alert>
        ))}
    </SimulatorFrame>
  );
}
