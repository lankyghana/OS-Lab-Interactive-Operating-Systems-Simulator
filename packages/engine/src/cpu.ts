/**
 * CPU Scheduling engine.
 *
 * The simulation advances in unit time steps, which keeps every algorithm on the
 * same code path and produces a per-tick timeline that the visual simulator can
 * replay. The text-based simulator reads the summary fields of the same result,
 * so both interfaces always agree.
 */

export type CpuAlgorithm = 'FCFS' | 'SJF' | 'SRTF' | 'PRIORITY' | 'PRIORITY_P' | 'RR';

export const CPU_ALGORITHMS: { id: CpuAlgorithm; name: string; preemptive: boolean }[] = [
  { id: 'FCFS', name: 'First Come, First Served', preemptive: false },
  { id: 'SJF', name: 'Shortest Job First', preemptive: false },
  { id: 'SRTF', name: 'Shortest Remaining Time First', preemptive: true },
  { id: 'PRIORITY', name: 'Priority (Non-preemptive)', preemptive: false },
  { id: 'PRIORITY_P', name: 'Priority (Preemptive)', preemptive: true },
  { id: 'RR', name: 'Round Robin', preemptive: true },
];

export interface ProcessInput {
  id: string;
  arrival: number;
  burst: number;
  /** Lower number = higher priority. */
  priority?: number;
}

export interface CpuOptions {
  /** Time quantum for Round Robin. Default 2. */
  quantum?: number;
}

export interface GanttSlice {
  /** null when the CPU is idle. */
  pid: string | null;
  start: number;
  end: number;
}

export interface ProcessResult {
  id: string;
  arrival: number;
  burst: number;
  priority: number;
  firstStart: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

export type CpuProcessState = 'new' | 'ready' | 'running' | 'terminated';

export interface CpuTick {
  time: number;
  running: string | null;
  readyQueue: string[];
  states: Record<string, CpuProcessState>;
  remaining: Record<string, number>;
  events: string[];
}

export interface CpuResult {
  algorithm: CpuAlgorithm;
  quantum?: number;
  gantt: GanttSlice[];
  processes: ProcessResult[];
  executionOrder: string[];
  averageWaiting: number;
  averageTurnaround: number;
  averageResponse: number;
  totalTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
  /** One snapshot per time unit, plus a final snapshot at totalTime. */
  timeline: CpuTick[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateProcesses(processes: ProcessInput[]): void {
  if (processes.length === 0) throw new ValidationError('Add at least one process.');
  if (processes.length > 50) throw new ValidationError('A maximum of 50 processes is supported.');
  const ids = new Set<string>();
  for (const p of processes) {
    if (!p.id || !p.id.trim()) throw new ValidationError('Every process needs an ID.');
    if (ids.has(p.id)) throw new ValidationError(`Duplicate process ID "${p.id}".`);
    ids.add(p.id);
    if (!Number.isInteger(p.arrival) || p.arrival < 0)
      throw new ValidationError(`${p.id}: arrival time must be a whole number ≥ 0.`);
    if (!Number.isInteger(p.burst) || p.burst < 1)
      throw new ValidationError(`${p.id}: burst time must be a whole number ≥ 1.`);
    if (p.priority !== undefined && !Number.isInteger(p.priority))
      throw new ValidationError(`${p.id}: priority must be a whole number.`);
  }
  const total = processes.reduce((s, p) => s + p.burst, 0) + Math.max(...processes.map((p) => p.arrival));
  if (total > 2000) throw new ValidationError('Total simulated time is too large (max 2000 units).');
}

const round = (n: number) => Math.round(n * 100) / 100;

export function scheduleCpu(input: ProcessInput[], algorithm: CpuAlgorithm, options: CpuOptions = {}): CpuResult {
  validateProcesses(input);
  const quantum = options.quantum ?? 2;
  if (algorithm === 'RR' && (!Number.isInteger(quantum) || quantum < 1))
    throw new ValidationError('Time quantum must be a whole number ≥ 1.');

  const procs = input.map((p, index) => ({ ...p, priority: p.priority ?? 0, index }));
  const byId = new Map(procs.map((p) => [p.id, p]));
  const arrivalOrder = [...procs].sort((a, b) => a.arrival - b.arrival || a.index - b.index);

  const remaining: Record<string, number> = {};
  const states: Record<string, CpuProcessState> = {};
  for (const p of procs) {
    remaining[p.id] = p.burst;
    states[p.id] = 'new';
  }
  const firstStart: Record<string, number> = {};
  const completion: Record<string, number> = {};

  const ready: string[] = [];
  let running: string | null = null;
  let quantumUsed = 0;
  let done = 0;
  let t = 0;
  let arrivalPtr = 0;
  const gantt: GanttSlice[] = [];
  const timeline: CpuTick[] = [];
  const executionOrder: string[] = [];
  let contextSwitches = 0;
  let lastRan: string | null = null;

  const key = (id: string): number => {
    const p = byId.get(id)!;
    switch (algorithm) {
      case 'SJF':
        return p.burst;
      case 'SRTF':
        return remaining[id];
      case 'PRIORITY':
      case 'PRIORITY_P':
        return p.priority;
      default:
        return 0;
    }
  };

  /** Pick the next process. FCFS/RR take the queue head; others take the minimum key. */
  const pick = (preferred: string | null): string => {
    if (algorithm === 'FCFS' || algorithm === 'RR') return ready.shift()!;
    let best = 0;
    for (let i = 1; i < ready.length; i++) {
      const a = ready[i];
      const b = ready[best];
      const ka = key(a);
      const kb = key(b);
      if (ka < kb) best = i;
      else if (ka === kb) {
        // Ties: keep the process that was already running (avoids needless switches),
        // then earlier arrival, then input order.
        if (b === preferred) continue;
        if (a === preferred) best = i;
        else {
          const pa = byId.get(a)!;
          const pb = byId.get(b)!;
          if (pa.arrival < pb.arrival || (pa.arrival === pb.arrival && pa.index < pb.index)) best = i;
        }
      }
    }
    return ready.splice(best, 1)[0];
  };

  while (done < procs.length) {
    const events: string[] = [];

    // 1. Arrivals at time t join the ready queue (before any preempted process).
    while (arrivalPtr < arrivalOrder.length && arrivalOrder[arrivalPtr].arrival <= t) {
      const p = arrivalOrder[arrivalPtr++];
      ready.push(p.id);
      states[p.id] = 'ready';
      events.push(`${p.id} arrives and joins the ready queue`);
    }

    // 2. Round Robin quantum expiry.
    if (algorithm === 'RR' && running && quantumUsed >= quantum) {
      events.push(`${running} used its ${quantum}-unit quantum and returns to the ready queue`);
      ready.push(running);
      states[running] = 'ready';
      running = null;
    }

    // 3. Preemptive algorithms re-evaluate every tick.
    let previous: string | null = null;
    if ((algorithm === 'SRTF' || algorithm === 'PRIORITY_P') && running) {
      previous = running;
      ready.push(running);
      states[running] = 'ready';
      running = null;
    }

    // 4. Dispatch.
    if (!running && ready.length > 0) {
      const next = pick(previous);
      if (previous && next !== previous) {
        events.push(`${next} preempts ${previous}`);
      }
      running = next;
      states[next] = 'running';
      if (next !== previous) {
        quantumUsed = 0;
        if (firstStart[next] === undefined) {
          firstStart[next] = t;
          events.push(`${next} is dispatched to the CPU for the first time`);
        } else if (!previous) {
          events.push(`${next} is dispatched to the CPU`);
        }
      }
    }

    if (!running) events.push('CPU is idle');

    timeline.push({
      time: t,
      running,
      readyQueue: [...ready],
      states: { ...states },
      remaining: { ...remaining },
      events,
    });

    // 5. Execute one unit.
    const last = gantt[gantt.length - 1];
    if (last && last.pid === running) last.end = t + 1;
    else {
      gantt.push({ pid: running, start: t, end: t + 1 });
      if (running) {
        if (lastRan !== null && lastRan !== running) contextSwitches++;
        executionOrder.push(running);
        lastRan = running;
      }
    }

    if (running) {
      remaining[running]--;
      quantumUsed++;
      if (remaining[running] === 0) {
        completion[running] = t + 1;
        states[running] = 'terminated';
        done++;
        running = null;
      }
    }
    t++;
  }

  timeline.push({
    time: t,
    running: null,
    readyQueue: [],
    states: { ...states },
    remaining: { ...remaining },
    events: ['All processes have terminated'],
  });

  const processes: ProcessResult[] = procs.map((p) => {
    const turnaround = completion[p.id] - p.arrival;
    return {
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      firstStart: firstStart[p.id],
      completion: completion[p.id],
      turnaround,
      waiting: turnaround - p.burst,
      response: firstStart[p.id] - p.arrival,
    };
  });

  const n = processes.length;
  const busy = procs.reduce((s, p) => s + p.burst, 0);
  const startTime = arrivalOrder[0].arrival;
  const span = t - startTime;

  return {
    algorithm,
    quantum: algorithm === 'RR' ? quantum : undefined,
    gantt,
    processes,
    executionOrder,
    averageWaiting: round(processes.reduce((s, p) => s + p.waiting, 0) / n),
    averageTurnaround: round(processes.reduce((s, p) => s + p.turnaround, 0) / n),
    averageResponse: round(processes.reduce((s, p) => s + p.response, 0) / n),
    totalTime: t,
    cpuUtilization: round((busy / span) * 100),
    throughput: round(n / span),
    contextSwitches,
    timeline,
  };
}

export function compareCpu(
  input: ProcessInput[],
  algorithms: CpuAlgorithm[] = CPU_ALGORITHMS.map((a) => a.id),
  options: CpuOptions = {},
): CpuResult[] {
  return algorithms.map((a) => scheduleCpu(input, a, options));
}
