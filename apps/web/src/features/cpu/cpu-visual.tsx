'use client';

import { useMemo } from 'react';
import type { CpuResult } from '@os-lab/engine';
import { usePlayback } from '@/lib/use-playback';
import { cn, colorFor, fmt } from '@/lib/utils';
import { EventLog, LabBox, LabPanel, PlaybackControls, Stat } from '@/components/sim/lab';
import { GanttChart } from '@/components/sim/gantt';

function Chip({ id, ids, sub, dim }: { id: string; ids: string[]; sub?: string; dim?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[12.5px] font-bold text-[#141413] animate-slide-in', dim && 'opacity-40')}
      style={{ background: colorFor(id, ids) }}
    >
      {id}
      {sub && <span className="rounded bg-black/15 px-1 text-[10.5px] font-semibold">{sub}</span>}
    </span>
  );
}

export function CpuVisual({ result, onStart }: { result: CpuResult; onStart: () => void }) {
  const pb = usePlayback(result.timeline.length, result, onStart);
  const tick = result.timeline[pb.index];
  const ids = result.processes.map((p) => p.id);
  const byState = (s: string) => ids.filter((id) => tick.states[id] === s);
  const finished = pb.index === pb.last;

  const log = useMemo(
    () =>
      result.timeline
        .slice(0, pb.index + 1)
        .flatMap((t) =>
          t.events.map((e, i) => ({
            key: `${t.time}-${i}`,
            time: `t=${t.time}`,
            text: e,
            tone: (e.includes('terminated') || e.includes('dispatched') ? 'good' : e.includes('preempt') || e.includes('quantum') ? 'bad' : 'default') as 'good' | 'bad' | 'default',
          })),
        )
        .reverse(),
    [result, pb.index],
  );

  const running = tick.running;
  return (
    <LabPanel
      title={`CPU scheduler · ${result.algorithm}${result.quantum ? ` · q=${result.quantum}` : ''}`}
      meta={
        <>
          <span>t = {tick.time}</span>
          <span className="text-lab-line">|</span>
          <span>end = {result.totalTime}</span>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <PlaybackControls pb={pb} positionLabel={`time ${tick.time} / ${result.totalTime}`} />

        <div className="grid gap-3 lg:grid-cols-[1fr_200px_1fr]">
          <LabBox label={`Ready queue (${tick.readyQueue.length})`}>
            <div className="flex min-h-[44px] flex-wrap items-center gap-2">
              {tick.readyQueue.length === 0 && <span className="font-mono text-xs text-lab-dim">empty</span>}
              {tick.readyQueue.map((id, i) => (
                <span key={id} className="flex items-center gap-1.5">
                  {i === 0 && <span className="font-mono text-[10px] text-lab-dim">head</span>}
                  <Chip id={id} ids={ids} sub={`${tick.remaining[id]}`} />
                </span>
              ))}
            </div>
            {byState('new').length > 0 && (
              <div className="mt-3 border-t border-lab-line pt-2">
                <p className="mb-1.5 text-[12.5px] text-lab-dim">Not yet arrived</p>
                <div className="flex flex-wrap gap-1.5">
                  {byState('new').map((id) => (
                    <Chip key={id} id={id} ids={ids} dim sub={`@${result.processes.find((p) => p.id === id)!.arrival}`} />
                  ))}
                </div>
              </div>
            )}
          </LabBox>

          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-colors',
              running ? 'border-signal/60 bg-signal/5' : 'border-dashed border-lab-line bg-lab-panel/50',
            )}
          >
            <p className="font-mono text-[10.5px] font-semibold text-lab-dim">CPU</p>
            {running ? (
              <>
                <span
                  className="mt-2 grid h-16 w-16 place-items-center rounded-2xl font-mono text-xl font-bold text-[#141413] animate-pulse-ring"
                  style={{ background: colorFor(running, ids) }}
                >
                  {running}
                </span>
                <p className="mt-2 font-mono text-xs text-lab-dim">
                  remaining <span className="text-lab-text">{tick.remaining[running]}</span>
                </p>
              </>
            ) : (
              <p className="mt-3 font-mono text-sm text-lab-dim">{finished ? 'done' : 'idle'}</p>
            )}
          </div>

          <LabBox label={`Terminated (${byState('terminated').length}/${ids.length})`}>
            <div className="flex min-h-[44px] flex-wrap items-center gap-2">
              {byState('terminated').length === 0 && <span className="font-mono text-xs text-lab-dim">none yet</span>}
              {byState('terminated').map((id) => (
                <Chip key={id} id={id} ids={ids} sub="✓" />
              ))}
            </div>
          </LabBox>
        </div>

        <LabBox label="Gantt chart">
          <GanttChart gantt={result.gantt} ids={ids} upTo={tick.time} total={result.totalTime} tone="lab" />
        </LabBox>

        <div className="grid gap-3 lg:grid-cols-2">
          <LabBox label="Process states">
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[12px] tabular">
                <thead>
                  <tr className="text-left text-lab-dim">
                    <th className="py-1 pr-2 font-medium">PID</th>
                    <th className="py-1 pr-2 font-medium">State</th>
                    <th className="py-1 pr-2 text-right font-medium">Remaining</th>
                    <th className="py-1 text-right font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {result.processes.map((p) => {
                    const st = tick.states[p.id];
                    const done = p.burst - tick.remaining[p.id];
                    return (
                      <tr key={p.id} className="border-t border-lab-line/60">
                        <td className="py-1.5 pr-2 font-bold" style={{ color: colorFor(p.id, ids) }}>
                          {p.id}
                        </td>
                        <td className="py-1.5 pr-2">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10.5px] uppercase',
                              st === 'running' && 'bg-signal/15 text-signal',
                              st === 'ready' && 'bg-warn/15 text-warn',
                              st === 'terminated' && 'bg-lab-raised text-lab-dim',
                              st === 'new' && 'text-lab-dim',
                            )}
                          >
                            {st}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 text-right">
                          {tick.remaining[p.id]}/{p.burst}
                        </td>
                        <td className="py-1.5 text-right">
                          <div className="ml-auto h-1.5 w-20 rounded-full bg-lab-raised">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(done / p.burst) * 100}%`, background: colorFor(p.id, ids) }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </LabBox>
          <LabBox label="Event log">
            <EventLog entries={log} />
          </LabBox>
        </div>

        {finished && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 animate-slide-in">
            <Stat tone="lab" label="Avg waiting" value={fmt(result.averageWaiting)} />
            <Stat tone="lab" label="Avg turnaround" value={fmt(result.averageTurnaround)} />
            <Stat tone="lab" label="Avg response" value={fmt(result.averageResponse)} />
            <Stat tone="lab" label="CPU utilisation" value={`${fmt(result.cpuUtilization)}%`} />
          </div>
        )}
      </div>
    </LabPanel>
  );
}
