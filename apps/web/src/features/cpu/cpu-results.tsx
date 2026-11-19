'use client';

import type { CpuResult } from '@os-lab/engine';
import { Table, Td, Th } from '@/components/ui/table';
import { GanttChart } from '@/components/sim/gantt';
import { Stat } from '@/components/sim/lab';
import { colorFor, fmt } from '@/lib/utils';

/** The text-based result view. Also reused by Learn (worked examples) and Practice (solutions). */
export function CpuResults({ result, compact = false }: { result: CpuResult; compact?: boolean }) {
  const ids = result.processes.map((p) => p.id);
  const showPriority = result.algorithm.startsWith('PRIORITY');
  const n = result.processes.length;
  const sumW = result.processes.reduce((a, p) => a + p.waiting, 0);
  const sumT = result.processes.reduce((a, p) => a + p.turnaround, 0);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">Execution order</p>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[13px]">
          {result.gantt.map((g, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-faint">→</span>}
              <span
                className="rounded-md px-2 py-0.5 font-semibold"
                style={g.pid ? { background: colorFor(g.pid, ids), color: '#141413' } : { background: 'rgb(127 127 127/0.16)', color: 'var(--muted)' }}
              >
                {g.pid ?? 'idle'}
                <span className="ml-1 font-normal opacity-70">
                  {g.start}–{g.end}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">Gantt chart</p>
        <GanttChart gantt={result.gantt} ids={ids} />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Process</Th>
            <Th className="text-right">Arrival</Th>
            <Th className="text-right">Burst</Th>
            {showPriority && <Th className="text-right">Priority</Th>}
            <Th className="text-right">Completion</Th>
            <Th className="text-right">Turnaround</Th>
            <Th className="text-right">Waiting</Th>
            <Th className="text-right">Response</Th>
          </tr>
        </thead>
        <tbody>
          {result.processes.map((p) => (
            <tr key={p.id}>
              <Td className="font-mono font-semibold">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: colorFor(p.id, ids) }} />
                {p.id}
              </Td>
              <Td className="text-right">{p.arrival}</Td>
              <Td className="text-right">{p.burst}</Td>
              {showPriority && <Td className="text-right">{p.priority}</Td>}
              <Td className="text-right">{p.completion}</Td>
              <Td className="text-right" title={`${p.completion} − ${p.arrival}`}>
                {p.turnaround}
              </Td>
              <Td className="text-right" title={`${p.turnaround} − ${p.burst}`}>
                {p.waiting}
              </Td>
              <Td className="text-right" title={`${p.firstStart} − ${p.arrival}`}>
                {p.response}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Avg waiting" value={fmt(result.averageWaiting)} hint={`${sumW} ÷ ${n}`} />
        <Stat label="Avg turnaround" value={fmt(result.averageTurnaround)} hint={`${sumT} ÷ ${n}`} />
        <Stat label="Avg response" value={fmt(result.averageResponse)} />
        {!compact && <Stat label="CPU utilisation" value={`${fmt(result.cpuUtilization)}%`} hint={`${result.contextSwitches} context switches`} />}
      </div>
    </div>
  );
}
