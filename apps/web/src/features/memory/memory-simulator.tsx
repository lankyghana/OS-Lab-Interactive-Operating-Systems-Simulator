'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FIT_ALGORITHMS, allocateMemory, type FitAlgorithm, type MemoryRequest, type MemoryResult, type MemoryBlockState, type PartitionMode } from '@os-lab/engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Table, Td, Th } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { BarChart } from '@/components/charts/bar-chart';
import { EventLog, LabBox, LabPanel, PlaybackControls, SimulatorFrame, Stat, type SimTab } from '@/components/sim/lab';
import { usePlayback } from '@/lib/use-playback';
import { presetStore, progress } from '@/lib/progress';
import { cn, colorFor, parseNumberList } from '@/lib/utils';

export interface MemoryPreset {
  blocks: number[];
  requests: MemoryRequest[];
  algorithm?: FitAlgorithm;
}

const DEFAULT: MemoryPreset = {
  blocks: [100, 500, 200, 300, 600],
  requests: [
    { id: 'P1', size: 212 },
    { id: 'P2', size: 417 },
    { id: 'P3', size: 112 },
    { id: 'P4', size: 426 },
  ],
};

/** Memory map: each original block drawn as a bar split into process / free segments. */
export function MemoryMap({ blocks, ids, highlight, checked, tone = 'lab' }: { blocks: MemoryBlockState[]; ids: string[]; highlight?: number | null; checked?: Set<number>; tone?: 'lab' | 'light' }) {
  const max = Math.max(...blocks.map((b) => b.size));
  const lab = tone === 'lab';
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b) => (
        <div key={b.index} className="grid grid-cols-[72px_1fr_64px] items-center gap-3">
          <span className={cn('font-mono text-[12px]', lab ? 'text-lab-dim' : 'text-muted')}>
            Block {b.index + 1}
            {checked?.has(b.index) && highlight !== b.index && <span className="ml-1 text-warn">•</span>}
          </span>
          <div
            className={cn(
              'flex h-10 overflow-hidden rounded-lg ring-1 transition-all',
              lab ? 'bg-lab ring-lab-line' : 'bg-ink/[0.05] ring-line',
              highlight === b.index && 'ring-2 ring-signal',
            )}
            style={{ width: `${Math.max(18, (b.size / max) * 100)}%` }}
          >
            {b.segments.map((s, i) => (
              <div
                key={i}
                className={cn('flex items-center justify-center overflow-hidden whitespace-nowrap border-r font-mono text-[11.5px] font-semibold last:border-r-0', lab ? 'border-lab' : 'border-surface')}
                style={{
                  width: `${(s.size / b.size) * 100}%`,
                  background: s.owner ? colorFor(s.owner, ids) : undefined,
                  color: s.owner ? '#141413' : lab ? 'var(--lab-dim)' : 'var(--faint)',
                }}
                title={`${s.owner ?? 'Free'}: ${s.size}`}
              >
                {s.owner ? `${s.owner} ${s.size}` : s.size >= b.size * 0.12 ? `free ${s.size}` : ''}
              </div>
            ))}
          </div>
          <span className={cn('text-right font-mono text-[12px] tabular', lab ? 'text-lab-dim' : 'text-muted')}>{b.size}</span>
        </div>
      ))}
    </div>
  );
}

export function MemoryResults({ result }: { result: MemoryResult }) {
  const ids = result.allocations.map((a) => a.id);
  return (
    <div className="flex flex-col gap-5">
      <Table>
        <thead>
          <tr>
            <Th>Process</Th>
            <Th className="text-right">Size</Th>
            <Th>Allocated to</Th>
            <Th className="text-right">{result.mode === 'fixed' ? 'Internal frag.' : 'Hole left'}</Th>
          </tr>
        </thead>
        <tbody>
          {result.allocations.map((a) => (
            <tr key={a.id}>
              <Td className="font-mono font-semibold">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: colorFor(a.id, ids) }} />
                {a.id}
              </Td>
              <Td className="text-right">{a.size}</Td>
              <Td>{a.block === null ? <span className="font-medium text-bad">Not allocated (waits)</span> : `Block ${a.block + 1} (${result.steps.find((s) => s.request.id === a.id)!.checked[a.block].free} free)`}</Td>
              <Td className="text-right">{a.leftover ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ol className="flex flex-col gap-1.5 text-sm">
        {result.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-mono text-faint">{i + 1}.</span>
            <span>{s.explanation}</span>
          </li>
        ))}
      </ol>
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">Final memory map</p>
        <MemoryMap blocks={result.finalBlocks} ids={ids} tone="light" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Allocated" value={`${result.allocatedCount}/${result.allocations.length}`} />
        <Stat label="Utilisation" value={`${result.utilization}%`} hint={`${result.usedMemory} of ${result.totalMemory}`} />
        <Stat label={result.mode === 'fixed' ? 'Internal frag.' : 'Free memory'} value={result.mode === 'fixed' ? result.internalFragmentation : result.totalMemory - result.usedMemory} />
        <Stat label="External frag." value={result.externalFragmentation} hint={result.externalFragmentation ? 'Free space exists but no hole is large enough' : 'None'} />
      </div>
    </div>
  );
}

function MemoryVisual({ result, onStart }: { result: MemoryResult; onStart: () => void }) {
  const frames = result.steps.length + 1;
  const pb = usePlayback(frames, result, onStart);
  const ids = result.allocations.map((a) => a.id);
  const step = pb.index > 0 ? result.steps[pb.index - 1] : null;
  const blocks: MemoryBlockState[] = step
    ? step.blocks
    : result.finalBlocks.map((b) => ({ ...b, segments: [{ owner: null, size: b.size }], free: b.size }));
  const pending = result.allocations.slice(pb.index);
  const log = result.steps.slice(0, pb.index).map((s, i) => ({ key: String(i), time: `#${i + 1}`, text: s.explanation, tone: (s.chosenBlock === null ? 'bad' : 'good') as 'good' | 'bad' })).reverse();

  return (
    <LabPanel title={`Memory allocator · ${result.algorithm.replace('_', ' ')} · ${result.mode} partitions`} meta={<span>request {pb.index}/{result.steps.length}</span>}>
      <div className="flex flex-col gap-4">
        <PlaybackControls pb={pb} stepLabel="Next request" positionLabel={`request ${pb.index} / ${result.steps.length}`} />
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <LabBox label="Physical memory">
            <MemoryMap blocks={blocks} ids={ids} highlight={step?.chosenBlock} checked={new Set(step?.checked.filter((c) => c.fits).map((c) => c.block))} />
          </LabBox>
          <div className="flex flex-col gap-3">
            <LabBox label="Current request">
              {step ? (
                <div>
                  <span className="inline-flex rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-[#141413]" style={{ background: colorFor(step.request.id, ids) }}>
                    {step.request.id} · {step.request.size}
                  </span>
                  <div className="mt-3 flex flex-col gap-1 font-mono text-[11.5px]">
                    {step.checked.map((c) => (
                      <div key={c.block} className={cn('flex justify-between rounded px-1.5 py-0.5', c.block === step.chosenBlock ? 'bg-signal/15 text-signal' : c.fits ? 'text-lab-text' : 'text-lab-dim line-through')}>
                        <span>Block {c.block + 1}</span>
                        <span>{c.free} free</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-mono text-xs text-lab-dim">Press Start or Next request.</p>
              )}
            </LabBox>
            <LabBox label={`Waiting to be placed (${pending.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {pending.length === 0 && <span className="font-mono text-xs text-lab-dim">none</span>}
                {pending.map((a) => (
                  <span key={a.id} className="rounded-md px-2 py-1 font-mono text-[11.5px] font-bold text-[#141413]" style={{ background: colorFor(a.id, ids) }}>
                    {a.id} {a.size}
                  </span>
                ))}
              </div>
            </LabBox>
          </div>
        </div>
        <LabBox label="Allocation log">
          <EventLog entries={log} emptyText="Each allocation decision will be explained here." />
        </LabBox>
        {pb.index === pb.last && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 animate-slide-in">
            <Stat tone="lab" label="Allocated" value={`${result.allocatedCount}/${result.allocations.length}`} />
            <Stat tone="lab" label="Utilisation" value={`${result.utilization}%`} />
            <Stat tone="lab" label="Waiting" value={result.unallocated.join(', ') || 'none'} />
            <Stat tone="lab" label="External frag." value={result.externalFragmentation} />
          </div>
        )}
      </div>
    </LabPanel>
  );
}

export function MemorySimulator() {
  const [preset] = useState(() => presetStore.peek<MemoryPreset>('memory'));
  useEffect(() => {
    presetStore.clear('memory');
  }, []);
  const init = preset ?? DEFAULT;
  const [blocksText, setBlocksText] = useState(init.blocks.join(', '));
  const [requests, setRequests] = useState(init.requests.map((r) => ({ id: r.id, size: String(r.size) })));
  const [algorithm, setAlgorithm] = useState<FitAlgorithm>(init.algorithm ?? 'FIRST_FIT');
  const [mode, setMode] = useState<PartitionMode>('variable');
  const [tab, setTab] = useState<SimTab>('visual');
  const [calculated, setCalculated] = useState<MemoryResult | null>(null);

  const blocks = useMemo(() => parseNumberList(blocksText), [blocksText]);
  const reqs = useMemo(() => requests.map((r) => ({ id: r.id.trim(), size: r.size === '' ? NaN : Number(r.size) })), [requests]);

  const { result, error } = useMemo(() => {
    try {
      return { result: allocateMemory(blocks, reqs, algorithm, mode), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [blocks, reqs, algorithm, mode]);

  const comparison = useMemo(() => {
    if (tab !== 'compare' || error) return null;
    return FIT_ALGORITHMS.map((a) => allocateMemory(blocks, reqs, a.id, mode));
  }, [tab, error, blocks, reqs, mode]);
  const lastCompared = useRef('');
  useEffect(() => {
    if (!comparison) return;
    const k = JSON.stringify([blocks, reqs, mode]);
    if (k !== lastCompared.current) {
      lastCompared.current = k;
      progress.recordSimulation({ module: 'memory', algorithm: 'ALL', mode: 'compare' });
    }
  }, [comparison, blocks, reqs, mode]);

  const ids = requests.map((r) => r.id);
  const inputs = (
    <Card>
      <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_1fr_240px] *:min-w-0">
        <div>
          <Label htmlFor="mem-blocks">Memory blocks (holes), in order</Label>
          <Input id="mem-blocks" value={blocksText} onChange={(e) => setBlocksText(e.target.value)} className="font-mono" placeholder="100, 500, 200, 300, 600" />
          <p className="mt-1.5 text-xs text-muted">Sizes in KB, separated by commas or spaces.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => { setBlocksText(DEFAULT.blocks.join(', ')); setRequests(DEFAULT.requests.map((r) => ({ id: r.id, size: String(r.size) }))); }}>
              Textbook example
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setBlocksText(Array.from({ length: 5 }, () => (1 + Math.floor(Math.random() * 7)) * 100).join(', '));
                setRequests(Array.from({ length: 4 }, (_, i) => ({ id: `P${i + 1}`, size: String((5 + Math.floor(Math.random() * 45)) * 10) })));
              }}
            >
              Random
            </Button>
          </div>
        </div>
        <div>
          <Label>Processes (in arrival order)</Label>
          <div className="flex flex-col gap-1.5">
            {requests.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(r.id, ids) }} />
                <Input aria-label={`Process ${i + 1} ID`} value={r.id} onChange={(e) => setRequests((rs) => rs.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))} className="w-20 font-mono" />
                <Input aria-label={`${r.id} size`} type="number" min={1} value={r.size} onChange={(e) => setRequests((rs) => rs.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${r.id}`} disabled={requests.length <= 1} onClick={() => setRequests((rs) => rs.filter((_, j) => j !== i))}>
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" disabled={requests.length >= 12} onClick={() => setRequests((rs) => [...rs, { id: `P${rs.length + 1}`, size: '100' }])}>
            + Add process
          </Button>
        </div>
        <div className="flex flex-col gap-4 lg:border-l lg:border-line lg:pl-5">
          <div>
            <Label htmlFor="mem-algo">Algorithm</Label>
            <Select id="mem-algo" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as FitAlgorithm)}>
              {FIT_ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Partitioning</Label>
            <Tabs<PartitionMode>
              value={mode}
              onChange={setMode}
              items={[
                { value: 'variable', label: 'Variable' },
                { value: 'fixed', label: 'Fixed' },
              ]}
            />
            <p className="mt-1.5 text-xs text-muted">
              {mode === 'variable' ? 'Blocks are split; leftover holes can be reused.' : 'One process per block; leftover space is internal fragmentation.'}
            </p>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SimulatorFrame
      module="memory"
      eyebrow="Simulators / Memory Management"
      title="Memory Allocation"
      description="Place processes into free memory holes using First Fit, Best Fit or Worst Fit, and see the fragmentation each strategy leaves behind."
      algorithm={algorithm}
      tab={tab}
      onTab={setTab}
      inputs={inputs}
    >
      {tab === 'visual' &&
        (result ? (
          <MemoryVisual result={result} onStart={() => progress.recordSimulation({ module: 'memory', algorithm, mode: 'visual' })} />
        ) : (
          <Alert tone="warn" title="Fix the input to run the simulation">{error}</Alert>
        ))}
      {tab === 'text' && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Button disabled={!result} onClick={() => { setCalculated(result); progress.recordSimulation({ module: 'memory', algorithm, mode: 'text' }); }}>
                Calculate allocation
              </Button>
              {calculated && result && JSON.stringify(calculated.steps.map((s) => s.request)) + calculated.algorithm + calculated.mode + calculated.totalMemory !== JSON.stringify(result.steps.map((s) => s.request)) + result.algorithm + result.mode + result.totalMemory && (
                <span className="text-sm text-amber">Inputs changed. Recalculate to update.</span>
              )}
            </div>
            {calculated && <MemoryResults result={calculated} />}
          </CardContent>
        </Card>
      )}
      {tab === 'compare' &&
        (comparison ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {comparison.map((c) => (
              <Card key={c.algorithm} className={cn(c.algorithm === algorithm && 'ring-2 ring-brand/30')}>
                <CardContent className="p-4">
                  <p className="mb-3 font-semibold">{FIT_ALGORITHMS.find((a) => a.id === c.algorithm)!.name}</p>
                  <MemoryMap blocks={c.finalBlocks} ids={ids} tone="light" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Stat label="Allocated" value={`${c.allocatedCount}/${c.allocations.length}`} />
                    <Stat label="Utilisation" value={`${c.utilization}%`} />
                  </div>
                  <p className="mt-3 text-xs text-muted">{c.unallocated.length ? `Waiting: ${c.unallocated.join(', ')}` : 'Every process was allocated.'}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="lg:col-span-3">
              <CardContent className="p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold">Memory utilisation</p>
                <BarChart lowerIsBetter={false} unit="%" data={comparison.map((c) => ({ label: FIT_ALGORITHMS.find((a) => a.id === c.algorithm)!.name, value: c.utilization, highlight: c.algorithm === algorithm }))} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert tone="warn" title="Fix the input to compare">{error}</Alert>
        ))}
    </SimulatorFrame>
  );
}
