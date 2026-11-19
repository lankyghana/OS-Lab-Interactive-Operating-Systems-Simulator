import { describe, it, expect } from 'vitest';
import {
  scheduleCpu,
  compareCpu,
  allocateMemory,
  replacePages,
  parseReferenceString,
  scheduleDisk,
  createSystem,
  applyProcAction,
  allowedActions,
  generateLifecycle,
  generateExercise,
  gradeExercise,
  ValidationError,
} from '../src';

const brief = [
  { id: 'P1', arrival: 0, burst: 5 },
  { id: 'P2', arrival: 1, burst: 3 },
  { id: 'P3', arrival: 2, burst: 8 },
  { id: 'P4', arrival: 3, burst: 6 },
];

describe('CPU scheduling', () => {
  it('FCFS — example from the product brief', () => {
    const r = scheduleCpu(brief, 'FCFS');
    expect(r.executionOrder).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(r.processes.map((p) => p.completion)).toEqual([5, 8, 16, 22]);
    expect(r.processes.map((p) => p.waiting)).toEqual([0, 4, 6, 13]);
    expect(r.processes.map((p) => p.turnaround)).toEqual([5, 7, 14, 19]);
    expect(r.processes.map((p) => p.response)).toEqual([0, 4, 6, 13]);
    expect(r.averageWaiting).toBe(5.75);
    expect(r.averageTurnaround).toBe(11.25);
    expect(r.cpuUtilization).toBe(100);
  });

  it('SJF (non-preemptive)', () => {
    const r = scheduleCpu(brief, 'SJF');
    expect(r.executionOrder).toEqual(['P1', 'P2', 'P4', 'P3']);
    expect(r.averageWaiting).toBe(5.25);
  });

  it('SRTF — Silberschatz example, avg wait 6.5', () => {
    const r = scheduleCpu(
      [
        { id: 'P1', arrival: 0, burst: 8 },
        { id: 'P2', arrival: 1, burst: 4 },
        { id: 'P3', arrival: 2, burst: 9 },
        { id: 'P4', arrival: 3, burst: 5 },
      ],
      'SRTF',
    );
    expect(r.gantt).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 5 },
      { pid: 'P4', start: 5, end: 10 },
      { pid: 'P1', start: 10, end: 17 },
      { pid: 'P3', start: 17, end: 26 },
    ]);
    expect(r.averageWaiting).toBe(6.5);
  });

  it('Round Robin q=4 — Silberschatz example, avg wait 5.67', () => {
    const r = scheduleCpu(
      [
        { id: 'P1', arrival: 0, burst: 24 },
        { id: 'P2', arrival: 0, burst: 3 },
        { id: 'P3', arrival: 0, burst: 3 },
      ],
      'RR',
      { quantum: 4 },
    );
    expect(r.gantt.slice(0, 4)).toEqual([
      { pid: 'P1', start: 0, end: 4 },
      { pid: 'P2', start: 4, end: 7 },
      { pid: 'P3', start: 7, end: 10 },
      { pid: 'P1', start: 10, end: 30 },
    ]);
    expect(r.averageWaiting).toBe(5.67);
  });

  it('Round Robin puts new arrivals ahead of the preempted process', () => {
    const r = scheduleCpu(
      [
        { id: 'A', arrival: 0, burst: 4 },
        { id: 'B', arrival: 2, burst: 2 },
      ],
      'RR',
      { quantum: 2 },
    );
    expect(r.executionOrder).toEqual(['A', 'B', 'A']);
  });

  it('Priority (non-preemptive) — Silberschatz example, avg wait 8.2', () => {
    const r = scheduleCpu(
      [
        { id: 'P1', arrival: 0, burst: 10, priority: 3 },
        { id: 'P2', arrival: 0, burst: 1, priority: 1 },
        { id: 'P3', arrival: 0, burst: 2, priority: 4 },
        { id: 'P4', arrival: 0, burst: 1, priority: 5 },
        { id: 'P5', arrival: 0, burst: 5, priority: 2 },
      ],
      'PRIORITY',
    );
    expect(r.executionOrder).toEqual(['P2', 'P5', 'P1', 'P3', 'P4']);
    expect(r.averageWaiting).toBe(8.2);
  });

  it('Priority (preemptive) preempts on a higher-priority arrival', () => {
    const r = scheduleCpu(
      [
        { id: 'P1', arrival: 0, burst: 5, priority: 3 },
        { id: 'P2', arrival: 2, burst: 2, priority: 1 },
      ],
      'PRIORITY_P',
    );
    expect(r.gantt.map((g) => [g.pid, g.start, g.end])).toEqual([
      ['P1', 0, 2],
      ['P2', 2, 4],
      ['P1', 4, 7],
    ]);
  });

  it('handles idle CPU gaps', () => {
    const r = scheduleCpu(
      [
        { id: 'P1', arrival: 0, burst: 2 },
        { id: 'P2', arrival: 5, burst: 1 },
      ],
      'FCFS',
    );
    expect(r.gantt).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: null, start: 2, end: 5 },
      { pid: 'P2', start: 5, end: 6 },
    ]);
    expect(r.cpuUtilization).toBe(50);
  });

  it('produces a timeline that the visual simulator can replay', () => {
    const r = scheduleCpu(brief, 'RR', { quantum: 2 });
    expect(r.timeline.length).toBe(r.totalTime + 1);
    expect(r.timeline[0].running).toBe('P1');
    const last = r.timeline[r.timeline.length - 1];
    expect(Object.values(last.states).every((s) => s === 'terminated')).toBe(true);
  });

  it('compares all algorithms on the same input', () => {
    const all = compareCpu(brief);
    expect(all).toHaveLength(6);
    const srtf = all.find((a) => a.algorithm === 'SRTF')!;
    const fcfs = all.find((a) => a.algorithm === 'FCFS')!;
    expect(srtf.averageWaiting).toBeLessThanOrEqual(fcfs.averageWaiting);
  });

  it('validates input', () => {
    expect(() => scheduleCpu([], 'FCFS')).toThrow(ValidationError);
    expect(() => scheduleCpu([{ id: 'P1', arrival: 0, burst: 0 }], 'FCFS')).toThrow(/burst/);
    expect(() => scheduleCpu([{ id: 'P1', arrival: 0, burst: 1 }, { id: 'P1', arrival: 0, burst: 1 }], 'FCFS')).toThrow(/Duplicate/);
    expect(() => scheduleCpu(brief, 'RR', { quantum: 0 })).toThrow(/quantum/);
  });
});

describe('Memory allocation (textbook 100/500/200/300/600 with 212/417/112/426)', () => {
  const blocks = [100, 500, 200, 300, 600];
  const reqs = [212, 417, 112, 426].map((size, i) => ({ id: `P${i + 1}`, size }));
  const blocksOf = (r: ReturnType<typeof allocateMemory>) => r.allocations.map((a) => (a.block === null ? null : a.block + 1));

  it('First Fit', () => {
    const r = allocateMemory(blocks, reqs, 'FIRST_FIT');
    expect(blocksOf(r)).toEqual([2, 5, 2, null]);
    expect(r.unallocated).toEqual(['P4']);
    expect(r.externalFragmentation).toBeGreaterThan(0);
  });
  it('Best Fit', () => {
    const r = allocateMemory(blocks, reqs, 'BEST_FIT');
    expect(blocksOf(r)).toEqual([4, 2, 3, 5]);
    expect(r.unallocated).toEqual([]);
  });
  it('Worst Fit', () => {
    const r = allocateMemory(blocks, reqs, 'WORST_FIT');
    expect(blocksOf(r)).toEqual([5, 2, 5, null]);
  });
  it('Fixed partitions do not reuse a partially used block', () => {
    const r = allocateMemory(blocks, reqs, 'FIRST_FIT', 'fixed');
    expect(blocksOf(r)).toEqual([2, 5, 3, null]);
    expect(r.internalFragmentation).toBe(500 - 212 + (600 - 417) + (200 - 112));
  });
  it('records a step per request with the blocks checked', () => {
    const r = allocateMemory(blocks, reqs, 'BEST_FIT');
    expect(r.steps).toHaveLength(4);
    expect(r.steps[0].checked).toHaveLength(5);
  });
});

describe('Page replacement (Silberschatz reference string, 3 frames)', () => {
  const ref = parseReferenceString('7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1');
  it('FIFO → 15 faults', () => expect(replacePages(ref, 3, 'FIFO').faults).toBe(15));
  it('LRU → 12 faults', () => expect(replacePages(ref, 3, 'LRU').faults).toBe(12));
  it('Optimal → 9 faults', () => expect(replacePages(ref, 3, 'OPTIMAL').faults).toBe(9));
  it("Belady's anomaly with FIFO", () => {
    const b = parseReferenceString('1,2,3,4,1,2,5,1,2,3,4,5');
    expect(replacePages(b, 3, 'FIFO').faults).toBe(9);
    expect(replacePages(b, 4, 'FIFO').faults).toBe(10);
  });
  it('rejects malformed reference strings', () => {
    expect(() => parseReferenceString('1 2 x')).toThrow(ValidationError);
  });
});

describe('Disk scheduling (queue 98 183 37 122 14 124 65 67, head 53, 0–199)', () => {
  const q = [98, 183, 37, 122, 14, 124, 65, 67];
  it('FCFS → 640', () => expect(scheduleDisk(q, 53, 'FCFS').totalMovement).toBe(640));
  it('SSTF → 236', () => {
    const r = scheduleDisk(q, 53, 'SSTF');
    expect(r.order).toEqual([65, 67, 37, 14, 98, 122, 124, 183]);
    expect(r.totalMovement).toBe(236);
  });
  it('SCAN towards 0 → 236', () => {
    const r = scheduleDisk(q, 53, 'SCAN', { direction: 'down' });
    expect(r.path).toEqual([53, 37, 14, 0, 65, 67, 98, 122, 124, 183]);
    expect(r.totalMovement).toBe(236);
  });
  it('C-SCAN upwards → 382 including the return sweep', () => {
    const r = scheduleDisk(q, 53, 'C_SCAN', { direction: 'up' });
    expect(r.path).toEqual([53, 65, 67, 98, 122, 124, 183, 199, 0, 14, 37]);
    expect(r.totalMovement).toBe(382);
    expect(scheduleDisk(q, 53, 'C_SCAN', { direction: 'up', countReturnSweep: false }).totalMovement).toBe(183);
  });
  it('LOOK and C-LOOK', () => {
    expect(scheduleDisk(q, 53, 'LOOK').totalMovement).toBe(299);
    expect(scheduleDisk(q, 53, 'C_LOOK').totalMovement).toBe(322);
  });
  it('validates head and requests', () => {
    expect(() => scheduleDisk([300], 53, 'FCFS')).toThrow(ValidationError);
    expect(() => scheduleDisk([10], 250, 'FCFS')).toThrow(ValidationError);
  });
});

describe('Process management', () => {
  it('follows the five-state model', () => {
    let s = createSystem();
    s = applyProcAction(s, { type: 'create', name: 'Editor' });
    expect(s.processes[0].state).toBe('NEW');
    expect(allowedActions(s, 1)).toEqual(['admit']);
    s = applyProcAction(s, { type: 'admit', pid: 1 });
    s = applyProcAction(s, { type: 'dispatch', pid: 1 });
    expect(s.running).toBe(1);
    s = applyProcAction(s, { type: 'block', pid: 1, reason: 'disk I/O' });
    expect(s.waitQueue).toEqual([1]);
    s = applyProcAction(s, { type: 'wake', pid: 1 });
    expect(s.readyQueue).toEqual([1]);
    s = applyProcAction(s, { type: 'dispatch', pid: 1 });
    s = applyProcAction(s, { type: 'exit', pid: 1 });
    expect(s.processes[0].state).toBe('TERMINATED');
    expect(s.processes[0].history.map((h) => h.to)).toEqual(['NEW', 'READY', 'RUNNING', 'WAITING', 'READY', 'RUNNING', 'TERMINATED']);
  });

  it('rejects invalid transitions with an explanation', () => {
    let s = createSystem();
    s = applyProcAction(s, { type: 'create' });
    expect(() => applyProcAction(s, { type: 'dispatch', pid: 1 })).toThrow(/only valid from READY/);
    s = applyProcAction(s, { type: 'create' });
    s = applyProcAction(s, { type: 'admit', pid: 1 });
    s = applyProcAction(s, { type: 'admit', pid: 2 });
    s = applyProcAction(s, { type: 'dispatch', pid: 1 });
    expect(() => applyProcAction(s, { type: 'dispatch', pid: 2 })).toThrow(/CPU is busy/);
  });

  it('generates a complete, valid lifecycle scenario', () => {
    const frames = generateLifecycle(5, 42);
    const final = frames[frames.length - 1].state;
    expect(final.processes).toHaveLength(5);
    expect(final.processes.every((p) => p.state === 'TERMINATED')).toBe(true);
  });
});

describe('Practice exercises', () => {
  it('are deterministic and gradeable', () => {
    for (const kind of ['cpu', 'memory', 'paging', 'disk'] as const) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        const a = generateExercise(kind, 123, d);
        const b = generateExercise(kind, 123, d);
        expect(a).toEqual(b);
        const perfect = Object.fromEntries(a.questions.map((q) => [q.key, q.answer]));
        expect(gradeExercise(a, perfect).score).toBe(100);
        expect(gradeExercise(a, {}).score).toBe(0);
      }
    }
  });
});
