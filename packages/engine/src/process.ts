/**
 * Process Management engine — the five-state process model.
 *
 *   NEW ──admit──▶ READY ──dispatch──▶ RUNNING ──exit──▶ TERMINATED
 *                    ▲  ◀──timeout───────┘  │
 *                    │                      │ wait for I/O / event
 *                    └──event done── WAITING ◀┘
 *
 * The engine is a pure reducer: `apply(state, action)` returns a new state or throws
 * a TransitionError explaining why the transition is not allowed. A single CPU is
 * modelled, so at most one process can be RUNNING.
 */

import { ValidationError } from './cpu';

export type ProcState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export const PROC_STATES: ProcState[] = ['NEW', 'READY', 'RUNNING', 'WAITING', 'TERMINATED'];

export type ProcAction =
  | { type: 'create'; name?: string; priority?: number; parent?: number }
  | { type: 'admit'; pid: number }
  | { type: 'dispatch'; pid: number }
  | { type: 'timeout'; pid: number }
  | { type: 'block'; pid: number; reason?: string }
  | { type: 'wake'; pid: number }
  | { type: 'exit'; pid: number }
  | { type: 'tick' };

export interface PCB {
  pid: number;
  name: string;
  state: ProcState;
  priority: number;
  parent: number | null;
  programCounter: number;
  cpuTime: number;
  waitReason: string | null;
  createdAt: number;
  history: { time: number; from: ProcState | null; to: ProcState }[];
}

export interface ProcLogEntry {
  time: number;
  pid: number | null;
  transition: string;
  message: string;
}

export interface ProcSystem {
  time: number;
  nextPid: number;
  processes: PCB[];
  readyQueue: number[];
  waitQueue: number[];
  running: number | null;
  log: ProcLogEntry[];
}

export class TransitionError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'TransitionError';
  }
}

export const TRANSITIONS: { action: Exclude<ProcAction['type'], 'create' | 'tick'>; from: ProcState; to: ProcState; label: string }[] = [
  { action: 'admit', from: 'NEW', to: 'READY', label: 'Admit' },
  { action: 'dispatch', from: 'READY', to: 'RUNNING', label: 'Dispatch' },
  { action: 'timeout', from: 'RUNNING', to: 'READY', label: 'Timeout / Interrupt' },
  { action: 'block', from: 'RUNNING', to: 'WAITING', label: 'I/O or event wait' },
  { action: 'wake', from: 'WAITING', to: 'READY', label: 'I/O or event completion' },
  { action: 'exit', from: 'RUNNING', to: 'TERMINATED', label: 'Exit' },
];

export function createSystem(): ProcSystem {
  return { time: 0, nextPid: 1, processes: [], readyQueue: [], waitQueue: [], running: null, log: [] };
}

export function allowedActions(sys: ProcSystem, pid: number): ProcAction['type'][] {
  const p = sys.processes.find((x) => x.pid === pid);
  if (!p) return [];
  return TRANSITIONS.filter((t) => t.from === p.state && !(t.action === 'dispatch' && sys.running !== null)).map((t) => t.action);
}

export function applyProcAction(sys: ProcSystem, action: ProcAction): ProcSystem {
  const s: ProcSystem = {
    ...sys,
    processes: sys.processes.map((p) => ({ ...p, history: [...p.history] })),
    readyQueue: [...sys.readyQueue],
    waitQueue: [...sys.waitQueue],
    log: [...sys.log],
  };

  if (action.type === 'tick') {
    s.time++;
    if (s.running !== null) {
      const p = s.processes.find((x) => x.pid === s.running)!;
      p.cpuTime++;
      p.programCounter += 4;
    }
    return s;
  }

  if (action.type === 'create') {
    if (s.processes.filter((p) => p.state !== 'TERMINATED').length >= 12)
      throw new TransitionError('Process table is full (12 active processes). Terminate some processes first.');
    if (action.parent !== undefined && !s.processes.some((p) => p.pid === action.parent))
      throw new TransitionError(`Parent process ${action.parent} does not exist.`);
    const pid = s.nextPid++;
    const pcb: PCB = {
      pid,
      name: action.name?.trim() || `P${pid}`,
      state: 'NEW',
      priority: action.priority ?? 0,
      parent: action.parent ?? null,
      programCounter: 0,
      cpuTime: 0,
      waitReason: null,
      createdAt: s.time,
      history: [{ time: s.time, from: null, to: 'NEW' }],
    };
    s.processes.push(pcb);
    s.log.push({
      time: s.time,
      pid,
      transition: '→ NEW',
      message: `${pcb.name} (PID ${pid}) is created${pcb.parent ? ` by PID ${pcb.parent}` : ''}; the OS allocates a PCB.`,
    });
    return s;
  }

  const p = s.processes.find((x) => x.pid === action.pid);
  if (!p) throw new TransitionError(`Process ${action.pid} does not exist.`);
  const rule = TRANSITIONS.find((t) => t.action === action.type)!;
  if (p.state !== rule.from)
    throw new TransitionError(`${p.name} is ${p.state}; "${rule.label}" is only valid from ${rule.from}.`);
  if (action.type === 'dispatch' && s.running !== null) {
    const r = s.processes.find((x) => x.pid === s.running)!;
    throw new TransitionError(`The CPU is busy running ${r.name}. Only one process can run at a time on a single CPU.`);
  }

  const move = (to: ProcState, message: string) => {
    p.history.push({ time: s.time, from: p.state, to });
    s.log.push({ time: s.time, pid: p.pid, transition: `${p.state} → ${to}`, message });
    p.state = to;
  };
  const drop = (q: number[]) => {
    const i = q.indexOf(p.pid);
    if (i !== -1) q.splice(i, 1);
  };

  switch (action.type) {
    case 'admit':
      move('READY', `${p.name} is admitted and placed in the ready queue.`);
      s.readyQueue.push(p.pid);
      break;
    case 'dispatch':
      drop(s.readyQueue);
      move('RUNNING', `The dispatcher loads ${p.name}'s context; it now runs on the CPU.`);
      s.running = p.pid;
      break;
    case 'timeout':
      move('READY', `A timer interrupt preempts ${p.name}; its context is saved and it rejoins the ready queue.`);
      s.running = null;
      s.readyQueue.push(p.pid);
      break;
    case 'block':
      p.waitReason = action.reason ?? 'I/O request';
      move('WAITING', `${p.name} waits for ${p.waitReason} and releases the CPU.`);
      s.running = null;
      s.waitQueue.push(p.pid);
      break;
    case 'wake':
      drop(s.waitQueue);
      move('READY', `${p.waitReason ?? 'The event'} completed; ${p.name} returns to the ready queue.`);
      p.waitReason = null;
      s.readyQueue.push(p.pid);
      break;
    case 'exit':
      move('TERMINATED', `${p.name} finishes; the OS reclaims its resources and removes its PCB.`);
      s.running = null;
      break;
  }
  return s;
}

/** Deterministic pseudo-random generator (mulberry32) so scenarios and exercises are reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a valid automatic lifecycle scenario for the visual simulator.
 * Every frame is the system state after one action.
 */
export function generateLifecycle(count = 4, seed = 7): { action: ProcAction; state: ProcSystem }[] {
  if (count < 1 || count > 8) throw new ValidationError('Choose between 1 and 8 processes.');
  const rand = rng(seed);
  let sys = createSystem();
  const frames: { action: ProcAction; state: ProcSystem }[] = [];
  const doIt = (a: ProcAction) => {
    sys = applyProcAction(sys, a);
    frames.push({ action: a, state: sys });
  };
  const work: Record<number, number> = {};
  let created = 0;
  let guard = 0;

  while (guard++ < 400) {
    const alive = sys.processes.filter((p) => p.state !== 'TERMINATED');
    if (created === count && alive.length === 0) break;
    const r = rand();
    const newOnes = sys.processes.filter((p) => p.state === 'NEW');
    if (created < count && (r < 0.25 || alive.length === 0)) {
      doIt({ type: 'create' });
      created++;
      work[sys.nextPid - 1] = 2 + Math.floor(rand() * 3);
      continue;
    }
    if (newOnes.length && r < 0.5) {
      doIt({ type: 'admit', pid: newOnes[0].pid });
      continue;
    }
    if (sys.waitQueue.length && r < 0.65) {
      doIt({ type: 'wake', pid: sys.waitQueue[0] });
      continue;
    }
    if (sys.running === null) {
      if (sys.readyQueue.length) doIt({ type: 'dispatch', pid: sys.readyQueue[0] });
      else if (newOnes.length) doIt({ type: 'admit', pid: newOnes[0].pid });
      else if (sys.waitQueue.length) doIt({ type: 'wake', pid: sys.waitQueue[0] });
      continue;
    }
    const pid = sys.running;
    doIt({ type: 'tick' });
    work[pid]--;
    if (work[pid] <= 0) doIt({ type: 'exit', pid });
    else if (rand() < 0.35) doIt({ type: 'block', pid, reason: rand() < 0.5 ? 'disk I/O' : 'keyboard input' });
    else if (sys.readyQueue.length && rand() < 0.5) doIt({ type: 'timeout', pid });
  }
  return frames;
}
